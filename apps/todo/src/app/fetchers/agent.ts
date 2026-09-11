import { ParsedTask } from '@shared/types';
import apiClient from '../lib/apiClient';

export const parseTodoFetcher = async (text: string): Promise<ParsedTask> => {
  const { data } = await apiClient.post<ParsedTask>('/agent/parse-todo', {
    text,
  });
  return data;
};
