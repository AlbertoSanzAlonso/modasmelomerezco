export type AnalyticsRange = 7 | 30;

export interface AnalyticsTotals {
  pageviews: number;
  visitors: number;
}

export interface AnalyticsDailyPoint {
  date: string;
  pageviews: number;
  visitors: number;
}

export interface AnalyticsPathRow {
  path: string;
  pageviews: number;
  visitors: number;
}

export interface AnalyticsDeviceRow {
  device: string;
  pageviews: number;
  visitors: number;
}

export interface AdminAnalyticsResponse {
  range: AnalyticsRange;
  since: string;
  until: string;
  totals: AnalyticsTotals;
  daily: AnalyticsDailyPoint[];
  topPaths: AnalyticsPathRow[];
  devices: AnalyticsDeviceRow[];
}

export class AnalyticsApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AnalyticsApiError';
    this.status = status;
    this.code = code;
  }
}

export const analytics = {
  getAdminOverview: async (
    token: string,
    range: AnalyticsRange = 7
  ): Promise<AdminAnalyticsResponse> => {
    const response = await fetch(`/api/admin-analytics?range=${range}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AnalyticsApiError(
        (body as { message?: string }).message || 'Error al cargar analíticas',
        response.status,
        (body as { code?: string }).code
      );
    }

    return body as AdminAnalyticsResponse;
  },
};
