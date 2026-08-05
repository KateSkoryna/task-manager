import { useAuthStore } from './authStore';
import { signOut } from 'firebase/auth';
jest.mock('../lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));
describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true });
    jest.clearAllMocks();
  });
  test('starts loading without a user', () =>
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isLoading: true,
    }));
  test('stores user', () => {
    const user = { firebaseUid: 'u' } as never;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });
  test('sets loading state explicitly', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
  test('logs out and clears user', async () => {
    useAuthStore.setState({
      user: { firebaseUid: 'u' } as never,
      isLoading: false,
    });
    await useAuthStore.getState().logout();
    expect(signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
  test('clears user even when logout starts from null', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
