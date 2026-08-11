export async function checkReadiness(deps: {
  queryDb(): Promise<unknown>;
  rateLimitConfigured: boolean;
}): Promise<{ ok: boolean }> {
  if (!deps.rateLimitConfigured) return { ok: false };
  try {
    await deps.queryDb();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
