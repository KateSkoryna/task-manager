import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPreferences, UserPreferencesUpdate } from '@shared/types';
import { useAuthStore } from '../store/authStore';
import {
  getPreferencesFetcher,
  updatePreferencesFetcher,
} from '../fetchers/preferences';

export const preferencesQueryKey = (userId?: string) => ['preferences', userId];

export const usePreferences = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = preferencesQueryKey(user?.id);

  const query = useQuery<UserPreferences, Error>({
    queryKey,
    queryFn: () => getPreferencesFetcher(user!.id),
    enabled: !!user,
  });

  const mutation = useMutation<
    UserPreferences,
    Error,
    UserPreferencesUpdate,
    { previous?: UserPreferences }
  >({
    mutationFn: (updates) => updatePreferencesFetcher(user!.id, updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UserPreferences>(queryKey);
      if (previous) {
        queryClient.setQueryData<UserPreferences>(queryKey, {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
};
