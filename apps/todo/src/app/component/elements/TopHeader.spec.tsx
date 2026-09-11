import { fireEvent, render, screen } from '@testing-library/react';
import TopHeader from './TopHeader';

// TopHeader pulls in MobileDrawer -> SidebarContent -> authStore, which
// imports firebase/auth. jsdom's Jest environment resolves that to
// firebase's Node build, which needs a global `fetch` this test env doesn't
// provide — the same reason authStore.spec.ts mocks these two modules.
jest.mock('../../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => mockNavigate,
}));

const mockSetQuery = jest.fn();
const mockClear = jest.fn();
let mockSearchState: {
  query: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  matches: { id: string; name: string; todolistId: string | null }[];
};

jest.mock('../../hooks/useHeaderTaskSearch', () => ({
  useHeaderTaskSearch: () => ({
    query: mockSearchState.query,
    setQuery: mockSetQuery,
    status: mockSearchState.status,
    matches: mockSearchState.matches,
    clear: mockClear,
  }),
}));

describe('TopHeader search', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSetQuery.mockReset();
    mockClear.mockReset();
    mockSearchState = { query: '', status: 'idle', matches: [] };
  });

  it('shows no results panel while the query is empty', () => {
    render(<TopHeader />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('updates the query as the user types', () => {
    render(<TopHeader />);
    fireEvent.change(screen.getByTestId('header-search'), {
      target: { value: 't-shirt' },
    });
    expect(mockSetQuery).toHaveBeenCalledWith('t-shirt');
  });

  it('shows a loading state while searching', () => {
    mockSearchState = { query: 't-shirt', status: 'loading', matches: [] };
    render(<TopHeader />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows do laundry as a result when searching for t-shirt', () => {
    mockSearchState = {
      query: 't-shirt',
      status: 'success',
      matches: [{ id: 'todo-1', name: 'do laundry', todolistId: null }],
    };
    render(<TopHeader />);
    expect(screen.getByText('do laundry')).toBeInTheDocument();
  });

  it('navigates to the matched task and clears the search on click', () => {
    mockSearchState = {
      query: 't-shirt',
      status: 'success',
      matches: [{ id: 'todo-1', name: 'do laundry', todolistId: 'list-1' }],
    };
    render(<TopHeader />);

    fireEvent.click(screen.getByText('do laundry'));

    expect(mockNavigate).toHaveBeenCalledWith('/tasks', {
      state: { todoId: 'todo-1', listId: 'list-1' },
    });
    expect(mockClear).toHaveBeenCalled();
  });

  it('shows an empty state when nothing matches', () => {
    mockSearchState = { query: 't-shirt', status: 'success', matches: [] };
    render(<TopHeader />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
