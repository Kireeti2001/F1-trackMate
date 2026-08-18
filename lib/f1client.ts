// Browser-side fetch helpers that talk to the /api/f1 proxy.

export async function f1(
  ep: string,
  params: Record<string, string | number> = {},
  opts: { live?: boolean } = {},
): Promise<any[]> {
  // Keys stay raw: OpenF1 uses comparison operators in parameter names
  // (e.g. `date>2026-…`), which must survive to the upstream URL.
  const q = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  const url = `/api/f1?ep=${ep}&q=${encodeURIComponent(q)}${opts.live ? "&live=1" : ""}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`F1 API ${res.status} for ${ep}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

export async function f1safe(
  ep: string,
  params: Record<string, string | number> = {},
  opts: { live?: boolean } = {},
): Promise<any[]> {
  try {
    return await f1(ep, params, opts);
  } catch {
    return [];
  }
}
