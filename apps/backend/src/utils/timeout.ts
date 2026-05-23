export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'Operation',
  signal?: AbortSignal
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;

  if (signal?.aborted) {
    return Promise.reject(new Error(`${label} aborted before start`));
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  const abortPromise = signal
    ? new Promise<never>((_, reject) => {
        const onAbort = () => {
          reject(new Error(`${label} cancelled: ${(signal.reason as Error)?.message || 'aborted'}`));
        };
        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      })
    : null;

  const raceTargets = abortPromise
    ? [promise, timeoutPromise, abortPromise]
    : [promise, timeoutPromise];

  return Promise.race(raceTargets).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }) as Promise<T>;
}

export function createCancellablePromise<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  label = 'Operation'
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new Error(`${label} cancelled before start`));
  }
  return executor(signal);
}
