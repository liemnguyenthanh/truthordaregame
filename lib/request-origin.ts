/** Next may normalize req.url to localhost; Host retains the browser-facing authority. */
export function hasSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const target = new URL(req.url);
    return (
      origin === parsed.origin &&
      parsed.protocol === target.protocol &&
      parsed.host === (req.headers.get('host') || target.host)
    );
  } catch {
    return false;
  }
}
