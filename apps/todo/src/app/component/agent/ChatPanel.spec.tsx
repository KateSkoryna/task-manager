import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User, TodoList, TodoItem } from '@shared/types';
import ChatPanel from './ChatPanel';
import type { AgentChatMessage, AgentProposal } from '../../hooks/useAgentChat';

const FAKE_USER: User = {
  id: 'user-1',
  firebaseUid: 'firebase-1',
  email: 'a@example.com',
  displayName: 'A',
  firstName: 'A',
  lastName: 'A',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  preferences: {
    timezone: 'UTC',
    locale: 'en',
    reportCadence: 'off',
    deliveryHour: 9,
    tone: 'neutral',
    aiConsent: true,
  },
  telegramLinked: false,
};

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: User | null }) => unknown) =>
    selector({ user: FAKE_USER }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const usePreferences = jest.fn();
jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => usePreferences(),
}));

jest.mock('../../hooks/useAgentChatId', () => ({
  useAgentChatId: () => 'chat-1',
}));

const useAgentChat = jest.fn();
jest.mock('../../hooks/useAgentChat', () => ({
  useAgentChat: () => useAgentChat(),
}));

const useTodoListsQuery = jest.fn();
const useInboxTodosQuery = jest.fn();
jest.mock('../../fetchers/api', () => ({
  useTodoListsQuery: () => useTodoListsQuery(),
  useInboxTodosQuery: () => useInboxTodosQuery(),
}));

const send = jest.fn();
const confirm = jest.fn();
const cancel = jest.fn();

const defaultChatState = (
  overrides: Partial<{
    messages: AgentChatMessage[];
    isStreaming: boolean;
    error: string | null;
    pendingProposal: AgentProposal | null;
  }> = {}
) => ({
  messages: [],
  send,
  isStreaming: false,
  error: null,
  pendingProposal: null,
  confirm,
  cancel,
  ...overrides,
});

describe('ChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferences.mockReturnValue({
      preferences: { aiConsent: true },
    });
    useAgentChat.mockReturnValue(defaultChatState());
    useTodoListsQuery.mockReturnValue({ data: [] as TodoList[] });
    useInboxTodosQuery.mockReturnValue({ data: [] as TodoItem[] });
  });

  it('renders nothing when AI consent is off', () => {
    usePreferences.mockReturnValue({ preferences: { aiConsent: false } });
    render(<ChatPanel />);
    expect(screen.queryByTestId('chat-panel-launcher')).not.toBeInTheDocument();
  });

  it('shows the launcher, then opens the panel on click', async () => {
    render(<ChatPanel />);
    expect(screen.getByTestId('chat-panel-launcher')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-panel-launcher')).not.toBeInTheDocument();
  });

  it('closes the panel from the header close button', async () => {
    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));
    await userEvent.click(screen.getByTestId('chat-panel-close'));

    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-panel-launcher')).toBeInTheDocument();
  });

  it('renders the conversation, including a tool-call chip', async () => {
    useAgentChat.mockReturnValue(
      defaultChatState({
        messages: [
          { id: 'm1', role: 'user', text: 'add buy milk' },
          {
            id: 'm2',
            role: 'assistant',
            text: 'Added it.',
            toolCalls: [
              {
                name: 'create_tasks',
                input: { tasks: [{ name: 'Buy milk' }] },
              },
            ],
          },
        ],
      })
    );

    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    expect(screen.getByText('add buy milk')).toBeInTheDocument();
    expect(screen.getByText('Added it.')).toBeInTheDocument();
    expect(screen.getByText(/agent\.tool\.createTask/i)).toBeInTheDocument();
  });

  it('shows no chip for the confirmation_required half of a self-resolving delete, only for the real outcome', async () => {
    // One turn can contain both: the model asks for confirmation (no token
    // yet), then immediately re-calls with the fresh token once it has it
    // (see useAgentChat's tool_result handling). The first attempt must not
    // render its own "Deleted task" chip — only the ProposalCard should
    // speak for that moment, and only the real deletion gets a chip.
    useAgentChat.mockReturnValue(
      defaultChatState({
        messages: [
          { id: 'm1', role: 'user', text: 'delete task t1' },
          {
            id: 'm2',
            role: 'assistant',
            text: 'Deleted it.',
            toolCalls: [
              {
                name: 'delete_task',
                input: { id: 't1' },
                result: { ok: false, reason: 'confirmation_required' },
              },
              {
                name: 'delete_task',
                input: { id: 't1' },
                result: { ok: true, data: { id: 't1' } },
              },
            ],
          },
        ],
      })
    );

    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    expect(screen.getAllByText(/agent\.tool\.deleteTask/i)).toHaveLength(1);
  });

  it('renders a clickable task link for a successful create_tasks result, and navigates on click', async () => {
    useAgentChat.mockReturnValue(
      defaultChatState({
        messages: [
          { id: 'm1', role: 'user', text: 'add buy milk' },
          {
            id: 'm2',
            role: 'assistant',
            text: 'Added it.',
            toolCalls: [
              {
                name: 'create_tasks',
                input: { tasks: [{ name: 'Buy milk' }] },
                result: {
                  ok: true,
                  data: [{ id: 'todo-1', name: 'Buy milk', todolistId: null }],
                },
              },
            ],
          },
        ],
      })
    );

    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    const link = screen.getByRole('button', { name: 'Buy milk' });
    expect(link).toBeInTheDocument();
    // The plain-text fallback chip must not also render for a linked result.
    expect(
      screen.queryByText(/agent\.tool\.createTask/i)
    ).not.toBeInTheDocument();

    await userEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith('/tasks', {
      state: { todoId: 'todo-1', listId: null },
    });
  });

  it('sends the composer text and clears the input', async () => {
    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    const input = screen.getByTestId('chat-composer-input');
    await userEvent.type(input, 'buy milk');
    await userEvent.click(screen.getByTestId('chat-composer-send'));

    expect(send).toHaveBeenCalledWith('buy milk');
    expect(input).toHaveValue('');
  });

  it('disables the composer while streaming', async () => {
    useAgentChat.mockReturnValue(defaultChatState({ isStreaming: true }));
    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    expect(screen.getByTestId('chat-composer-input')).toBeDisabled();
    expect(screen.getByTestId('chat-composer-send')).toBeDisabled();
  });

  it('renders a proposal card and wires confirm/cancel to the hook', async () => {
    useAgentChat.mockReturnValue(
      defaultChatState({
        messages: [{ id: 'm1', role: 'assistant', text: 'Delete this task?' }],
        pendingProposal: {
          toolName: 'delete_task',
          input: { id: 'todo-1' },
          token: 'tok-1',
        },
      })
    );
    useInboxTodosQuery.mockReturnValue({
      data: [
        {
          id: 'todo-1',
          name: 'Buy milk',
          status: 'pending',
          todolistId: null,
          order: 0,
          priority: 'medium',
          source: 'web',
        } satisfies TodoItem,
      ],
    });

    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('chat-proposal-confirm'));
    expect(confirm).toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('chat-proposal-cancel'));
    expect(cancel).toHaveBeenCalled();
  });

  it('shows an error message when the hook reports one', async () => {
    useAgentChat.mockReturnValue(
      defaultChatState({ error: 'The agent broke.' })
    );
    render(<ChatPanel />);
    await userEvent.click(screen.getByTestId('chat-panel-launcher'));

    expect(screen.getByRole('alert')).toHaveTextContent('The agent broke.');
  });
});
