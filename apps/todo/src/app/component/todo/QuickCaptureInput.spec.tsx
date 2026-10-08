import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QuickCaptureInput from './QuickCaptureInput';
import type { TodoItem } from '@shared/types';

const addInboxTodoMutate = jest.fn();
const editTodoMutate = jest.fn();
const parseTodoMutate = jest.fn();
const useInboxTodosQuery = jest.fn();
const usePreferences = jest.fn();

jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => usePreferences(),
}));

jest.mock('../../fetchers/api', () => ({
  useAddInboxTodoMutation: () => ({ mutate: addInboxTodoMutate }),
  useEditTodoMutation: () => ({ mutate: editTodoMutate }),
  useParseTodoMutation: () => ({ mutate: parseTodoMutate }),
  useInboxTodosQuery: () => useInboxTodosQuery(),
}));

const makeTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 't1',
  name: 'buy milk friday high prio',
  status: 'pending',
  todolistId: null,
  order: 0,
  priority: 'medium',
  source: 'web',
  ...overrides,
});

const testIds = {
  inputTestId: 'quick-capture-input',
  submitTestId: 'quick-capture-submit',
  noticeTestId: 'quick-capture-notice',
  undoTestId: 'quick-capture-undo',
};

const input = () => (
  <MemoryRouter>
    <QuickCaptureInput {...testIds} />
  </MemoryRouter>
);
const renderInput = () => render(input());

describe('QuickCaptureInput', () => {
  beforeEach(() => {
    addInboxTodoMutate.mockReset();
    editTodoMutate.mockReset();
    parseTodoMutate.mockReset();
    useInboxTodosQuery.mockReturnValue({ data: [] });
    usePreferences.mockReturnValue({ preferences: { aiConsent: true } });
  });

  test('creates the task immediately from the raw text, without waiting on the parse', async () => {
    renderInput();
    await userEvent.type(
      screen.getByTestId('quick-capture-input'),
      'buy milk friday high prio'
    );
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    expect(addInboxTodoMutate).toHaveBeenCalledWith(
      { name: 'buy milk friday high prio' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(parseTodoMutate).not.toHaveBeenCalled();
    expect(screen.getByTestId('quick-capture-input')).toHaveValue('');
  });

  test('applies the parsed fields and shows the enrichment notice on success', async () => {
    renderInput();
    await userEvent.type(
      screen.getByTestId('quick-capture-input'),
      'buy milk friday high prio'
    );
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    const [, createOpts] = addInboxTodoMutate.mock.calls[0];
    act(() => createOpts.onSuccess(makeTodo()));

    expect(parseTodoMutate).toHaveBeenCalledWith(
      'buy milk friday high prio',
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    const [, parseOpts] = parseTodoMutate.mock.calls[0];
    act(() =>
      parseOpts.onSuccess({
        name: 'Buy milk',
        dueDate: '2026-09-11',
        priority: 'high',
        notes: null,
        ambiguous: false,
      })
    );

    expect(editTodoMutate).toHaveBeenCalledWith(
      {
        id: 't1',
        name: 'Buy milk',
        priority: 'high',
        dueDate: '2026-09-11',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(
      screen.queryByTestId('quick-capture-notice')
    ).not.toBeInTheDocument();

    const [, editOpts] = editTodoMutate.mock.calls[0];
    act(() => editOpts.onSuccess());

    expect(
      await screen.findByTestId('quick-capture-notice')
    ).toBeInTheDocument();
  });

  test('leaves the raw task untouched when the model flags the text as ambiguous', async () => {
    renderInput();
    await userEvent.type(
      screen.getByTestId('quick-capture-input'),
      'buy milk, call mom tuesday, pay rent friday'
    );
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    act(() =>
      addInboxTodoMutate.mock.calls[0][1].onSuccess(
        makeTodo({ name: 'buy milk, call mom tuesday, pay rent friday' })
      )
    );
    act(() =>
      parseTodoMutate.mock.calls[0][1].onSuccess({
        name: 'buy milk, call mom tuesday, pay rent friday',
        dueDate: null,
        priority: 'medium',
        notes: null,
        ambiguous: true,
      })
    );

    expect(editTodoMutate).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('quick-capture-notice')
    ).not.toBeInTheDocument();
  });

  test('leaves the raw task untouched when the parse fails', async () => {
    renderInput();
    await userEvent.type(screen.getByTestId('quick-capture-input'), 'buy milk');
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    act(() =>
      addInboxTodoMutate.mock.calls[0][1].onSuccess(
        makeTodo({ name: 'buy milk' })
      )
    );
    // No onError handler is wired — parseTodo failing (timeout, consent off,
    // rate limit, bad JSON) simply never calls onSuccess.

    expect(editTodoMutate).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('quick-capture-notice')
    ).not.toBeInTheDocument();
  });

  test('undo restores the raw name and clears the parsed fields', async () => {
    renderInput();
    await userEvent.type(
      screen.getByTestId('quick-capture-input'),
      'buy milk friday high prio'
    );
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    act(() => addInboxTodoMutate.mock.calls[0][1].onSuccess(makeTodo()));
    act(() =>
      parseTodoMutate.mock.calls[0][1].onSuccess({
        name: 'Buy milk',
        dueDate: '2026-09-11',
        priority: 'high',
        notes: null,
        ambiguous: false,
      })
    );
    act(() => editTodoMutate.mock.calls[0][1].onSuccess());

    await userEvent.click(await screen.findByTestId('quick-capture-undo'));

    expect(editTodoMutate).toHaveBeenLastCalledWith({
      id: 't1',
      name: 'buy milk friday high prio',
      dueDate: null,
      priority: 'medium',
    });
    expect(
      screen.queryByTestId('quick-capture-notice')
    ).not.toBeInTheDocument();
  });

  test('does not overwrite a task the user already edited while the parse was in flight', async () => {
    const { rerender } = renderInput();
    await userEvent.type(
      screen.getByTestId('quick-capture-input'),
      'buy milk friday high prio'
    );
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    const created = makeTodo();
    act(() => addInboxTodoMutate.mock.calls[0][1].onSuccess(created));

    // The user renamed the task by hand before the background parse resolved.
    useInboxTodosQuery.mockReturnValue({
      data: [{ ...created, name: 'Buy milk (urgent)' }],
    });
    rerender(input());

    act(() =>
      parseTodoMutate.mock.calls[0][1].onSuccess({
        name: 'Buy milk',
        dueDate: '2026-09-11',
        priority: 'high',
        notes: null,
        ambiguous: false,
      })
    );

    expect(editTodoMutate).not.toHaveBeenCalled();
  });

  test('skips the parse and tells the user how to turn AI on when it is off', async () => {
    usePreferences.mockReturnValue({ preferences: { aiConsent: false } });
    renderInput();
    expect(
      screen.getByTestId('quick-capture-notice-ai-off')
    ).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/settings');

    await userEvent.type(screen.getByTestId('quick-capture-input'), 'buy milk');
    await userEvent.click(screen.getByTestId('quick-capture-submit'));
    act(() => {
      addInboxTodoMutate.mock.calls[0][1].onSuccess(makeTodo());
    });

    expect(parseTodoMutate).not.toHaveBeenCalled();
  });

  test('hides the AI note when AI features are on', () => {
    renderInput();

    expect(
      screen.queryByTestId('quick-capture-notice-ai-off')
    ).not.toBeInTheDocument();
  });

  test('hides the extra fields until More is pressed', async () => {
    renderInput();
    expect(
      screen.queryByTestId('quick-capture-input-notes')
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('quick-capture-input-more'));

    expect(screen.getByTestId('quick-capture-input-notes')).toBeInTheDocument();
    expect(
      screen.getByTestId('quick-capture-input-priority')
    ).toBeInTheDocument();
  });

  test('saves the fields chosen by hand and skips the AI parse', async () => {
    renderInput();
    await userEvent.type(screen.getByTestId('quick-capture-input'), 'pay rent');
    await userEvent.click(screen.getByTestId('quick-capture-input-more'));
    await userEvent.click(screen.getByTestId('quick-capture-input-priority'));
    await userEvent.click(
      screen.getByRole('button', { name: 'tasks.priority_high' })
    );
    await userEvent.type(
      screen.getByTestId('quick-capture-input-notes'),
      'bank transfer'
    );
    await userEvent.click(screen.getByTestId('quick-capture-submit'));

    expect(addInboxTodoMutate).toHaveBeenCalledWith(
      {
        name: 'pay rent',
        priority: 'high',
        dueDate: undefined,
        notes: 'bank transfer',
      },
      expect.anything()
    );
    act(() => {
      addInboxTodoMutate.mock.calls[0][1].onSuccess(makeTodo());
    });
    expect(parseTodoMutate).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('quick-capture-input-notes')
    ).not.toBeInTheDocument();
  });

  test('says in the placeholder that AI fills in the details, only when AI is on', () => {
    const { unmount } = renderInput();
    expect(screen.getByTestId('quick-capture-input')).toHaveAttribute(
      'placeholder',
      'tasks.quickCapturePlaceholder'
    );
    unmount();

    usePreferences.mockReturnValue({ preferences: { aiConsent: false } });
    renderInput();
    expect(screen.getByTestId('quick-capture-input')).toHaveAttribute(
      'placeholder',
      'tasks.quickCapturePlaceholderPlain'
    );
  });
});
