/** Retry only storage work; callers must finish the model request before entering this function. */
export async function retryPersistence<T>(
  save: () => Promise<T>,
  pause: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await save();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await pause(attempt === 0 ? 150 : 350);
    }
  }
  throw lastError;
}
