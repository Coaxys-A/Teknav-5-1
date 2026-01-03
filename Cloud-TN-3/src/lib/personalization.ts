export async function fetchPersonalizationState(apiBase = '') {
  const res = await fetch(`${apiBase}/personalization/state`, { credentials: 'include' });
  if (!res.ok) return { preferences: {}, realtime: {} };
  return res.json();
}

export async function sendPersonalizationEvent(
  payload: { type: 'preference'; delta: Record<string, number> } | { type: 'state'; state: Record<string, any> },
  apiBase = '',
) {
  await fetch(`${apiBase}/personalization/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
}
