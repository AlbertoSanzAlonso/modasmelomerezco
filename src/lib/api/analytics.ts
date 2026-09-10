import { supabase } from '../supabase';

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
  day: string | null;
  since: string;
  until: string;
  chartSince: string;
  chartUntil: string;
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

async function resolveAdminAccessToken(fallbackToken?: string | null): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  let accessToken = sessionData.session?.access_token || '';

  if (!accessToken) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    accessToken = refreshed.session?.access_token || '';
  }

  if (!accessToken) {
    accessToken = fallbackToken?.trim() || '';
  }

  if (!accessToken) {
    throw new AnalyticsApiError('Sesión de admin no disponible', 401);
  }

  return accessToken;
}

export const analytics = {
  getAdminOverview: async (
    token: string,
    range: AnalyticsRange = 7,
    day?: string | null
  ): Promise<AdminAnalyticsResponse> => {
    const accessToken = await resolveAdminAccessToken(token);
    const params = new URLSearchParams({ range: String(range) });
    if (day) params.set('day', day);

    const response = await fetch(`/api/admin-analytics?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
