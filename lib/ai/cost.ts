export function estimatedCost(
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  inputRate: string | undefined,
  outputRate: string | undefined,
): number | null {
  if (
    inputTokens === undefined ||
    outputTokens === undefined ||
    !inputRate?.trim() ||
    !outputRate?.trim()
  )
    return null;
  const a = Number(inputRate),
    b = Number(outputRate);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return null;
  return (inputTokens * a + outputTokens * b) / 1_000_000;
}
