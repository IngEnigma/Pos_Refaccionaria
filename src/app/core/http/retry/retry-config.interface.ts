export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly retryableMethods: readonly string[];
}
