import { PaginatedResult, Report, ReportPeriod } from '@shared/types';
import apiClient from '../lib/apiClient';

export interface ReportsQueryOptions {
  cursor?: string | null;
  sort?: 'asc' | 'desc';
  limit?: number;
}

export const getReportsFetcher = async (
  userId: string,
  period: ReportPeriod,
  options: ReportsQueryOptions = {}
): Promise<PaginatedResult<Report>> => {
  const { data } = await apiClient.get<PaginatedResult<Report>>(
    `/users/${userId}/reports`,
    {
      params: {
        period,
        cursor: options.cursor ?? undefined,
        sort: options.sort,
        limit: options.limit,
      },
    }
  );
  return data;
};

export const generateReportFetcher = async (
  userId: string,
  period: ReportPeriod,
  referenceDate?: string
): Promise<Report> => {
  const { data } = await apiClient.post<Report>(`/users/${userId}/reports`, {
    period,
    referenceDate,
  });
  return data;
};

export const getReportFetcher = async (
  userId: string,
  reportId: string
): Promise<Report> => {
  const { data } = await apiClient.get<Report>(
    `/users/${userId}/reports/${reportId}`
  );
  return data;
};

export const generateReportNarrativeFetcher = async (
  userId: string,
  reportId: string
): Promise<Report> => {
  const { data } = await apiClient.post<Report>(
    `/users/${userId}/reports/${reportId}/narrative`
  );
  return data;
};
