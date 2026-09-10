import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type RangeDays = 7 | 30;

interface VisitTotals {
  pageviews: number;
  visitors: number;
}

interface DayRow {
  timestamp: string;
  pageviews: number;
  visitors: number;
}

interface PathRow {
  requestPath: string;
  pageviews: number;
  visitors: number;
}

interface DeviceRow {
  deviceType: string;
  pageviews: number;
  visitors: number;
}

function parseRange(raw: string | string[] | undefined): RangeDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === '30' ? 30 : 7;
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function rangeBounds(days: RangeDays): { since: string; until: string } {
  const until = new Date();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  return { since: toDateParam(since), until: toDateParam(until) };
}

async function requireAdmin(
  req: VercelRequest
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return { ok: false, status: 401, message: 'No autorizado' };
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, message: 'No autorizado' };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { ok: false, status: 500, message: 'Supabase no configurado' };
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user?.email) {
    return { ok: false, status: 401, message: 'Sesión inválida' };
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const email = userData.user.email.toLowerCase();
  const { data: adminByEmail, error: emailError } = await adminClient
    .from('admins')
    .select('admin_id')
    .eq('email', email)
    .maybeSingle();

  if (emailError) {
    console.error('[admin-analytics] admins lookup', emailError);
    return { ok: false, status: 500, message: 'Error verificando administrador' };
  }

  if (adminByEmail) {
    return { ok: true };
  }

  const { data: adminById, error: idError } = await adminClient
    .from('admins')
    .select('admin_id')
    .eq('admin_id', userData.user.id)
    .maybeSingle();

  if (idError) {
    console.error('[admin-analytics] admins lookup by id', idError);
    return { ok: false, status: 500, message: 'Error verificando administrador' };
  }

  if (!adminById) {
    return { ok: false, status: 403, message: 'Acceso de administrador requerido' };
  }

  return { ok: true };
}

async function queryVercelAnalytics<T>(
  path: 'visits/count' | 'visits/aggregate',
  params: Record<string, string | number>
): Promise<T> {
  // No usar VERCEL_TOKEN: choca con la CLI/sistema de Vercel.
  const token = process.env.WEB_ANALYTICS_TOKEN;
  // VERCEL_PROJECT_ID lo inyecta Vercel automáticamente en runtime.
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.WEB_ANALYTICS_TEAM_ID;

  if (!token || !projectId) {
    throw Object.assign(new Error('Vercel Analytics no configurado'), {
      code: 'NOT_CONFIGURED',
    });
  }

  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${path}`);
  url.searchParams.set('projectId', projectId);
  if (teamId) url.searchParams.set('teamId', teamId);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (body as { error?: { message?: string }; message?: string }).error?.message ||
      (body as { message?: string }).message ||
      `Error Vercel Analytics (${response.status})`;
    throw Object.assign(new Error(message), { status: response.status, body });
  }

  return body as T;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Handler GET de analíticas (montado en notify-admin-order; no es function aparte). */
export async function handleAdminAnalytics(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await requireAdmin(req);
  if (auth.ok === false) {
    return res.status(auth.status).json({ message: auth.message });
  }

  if (!process.env.WEB_ANALYTICS_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    return res.status(503).json({
      code: 'NOT_CONFIGURED',
      message:
        'Configura WEB_ANALYTICS_TOKEN en las variables de entorno de Vercel (VERCEL_PROJECT_ID lo aporta el sistema)',
    });
  }

  const days = parseRange(req.query.range);
  const { since, until } = rangeBounds(days);

  try {
    const [totalsRes, dailyRes, pathsRes, devicesRes] = await Promise.all([
      queryVercelAnalytics<{ data: VisitTotals }>('visits/count', { since, until }),
      queryVercelAnalytics<{ data: DayRow[] }>('visits/aggregate', {
        since,
        until,
        by: 'day',
        limit: days,
      }),
      queryVercelAnalytics<{ data: PathRow[] }>('visits/aggregate', {
        since,
        until,
        by: 'requestPath',
        limit: 10,
      }),
      queryVercelAnalytics<{ data: DeviceRow[] }>('visits/aggregate', {
        since,
        until,
        by: 'deviceType',
        limit: 10,
      }),
    ]);

    const daily = (Array.isArray(dailyRes.data) ? dailyRes.data : []).map((row) => ({
      date: row.timestamp?.slice(0, 10) || '',
      pageviews: asNumber(row.pageviews),
      visitors: asNumber(row.visitors),
    }));

    const topPaths = (Array.isArray(pathsRes.data) ? pathsRes.data : []).map((row) => ({
      path: row.requestPath || '/',
      pageviews: asNumber(row.pageviews),
      visitors: asNumber(row.visitors),
    }));

    const devices = (Array.isArray(devicesRes.data) ? devicesRes.data : []).map((row) => ({
      device: row.deviceType || 'unknown',
      pageviews: asNumber(row.pageviews),
      visitors: asNumber(row.visitors),
    }));

    return res.status(200).json({
      range: days,
      since,
      until,
      totals: {
        pageviews: asNumber(totalsRes.data?.pageviews),
        visitors: asNumber(totalsRes.data?.visitors),
      },
      daily,
      topPaths,
      devices,
    });
  } catch (error) {
    const err = error as Error & { code?: string; status?: number };
    if (err.code === 'NOT_CONFIGURED') {
      return res.status(503).json({
        code: 'NOT_CONFIGURED',
        message: err.message,
      });
    }
    console.error('[admin-analytics]', error);
    return res.status(err.status && err.status < 500 ? err.status : 502).json({
      message: err.message || 'No se pudieron cargar las analíticas',
    });
  }
}
