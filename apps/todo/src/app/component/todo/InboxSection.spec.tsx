import { render, screen } from '@testing-library/react';
import InboxSection from './InboxSection';

jest.mock('../../fetchers/api', () => ({
  useAddInboxTodoMutation: () => ({ mutate: jest.fn() }),
  useEditTodoMutation: () => ({ mutate: jest.fn() }),
  useParseTodoMutation: () => ({ mutate: jest.fn() }),
  useInboxTodosQuery: () => ({ data: [] }),
}));
jest.mock('../../hooks/usePreferences', () => ({
  usePreferences: () => ({ preferences: { aiConsent: true } }),
}));
jest.mock('../../lib/imageUtils', () => ({
  uploadImage: jest.fn().mockResolvedValue('https://cdn/image.png'),
}));
jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { firebaseUid: string } }) => unknown) =>
    selector({ user: { firebaseUid: 'u1' } }),
}));

describe('InboxSection', () => {
  test('renders the quick-capture input', () => {
    render(<InboxSection todos={[]} />);
    expect(screen.getByTestId('inbox-quick-capture-input')).toBeInTheDocument();
    expect(
      screen.getByTestId('inbox-quick-capture-submit')
    ).toBeInTheDocument();
  });

  test('has no add-task button of its own', () => {
    render(<InboxSection todos={[]} />);
    expect(
      screen.queryByRole('button', { name: /add task/i })
    ).not.toBeInTheDocument();
  });
});
