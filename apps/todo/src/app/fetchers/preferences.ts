import { UserPreferences, UserPreferencesUpdate } from '@shared/types';
import apiClient from '../lib/apiClient';

export const getPreferencesFetcher = async (
  userId: string
): Promise<UserPreferences> => {
  const { data } = await apiClient.get<UserPreferences>(
    `/users/${userId}/preferences`
  );
  return data;
};

export const updatePreferencesFetcher = async (
  userId: string,
  updates: UserPreferencesUpdate
): Promise<UserPreferences> => {
  const { data } = await apiClient.patch<UserPreferences>(
    `/users/${userId}/preferences`,
    updates
  );
  return data;
};
