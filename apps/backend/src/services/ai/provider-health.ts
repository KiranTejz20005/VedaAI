import type { ProviderName } from './provider-errors';

export interface ProviderStats {
  requests: number;
  successes: number;
  validationFailures: number;
  parseFailures: number;
  transportFailures: number;
  timeoutFailures: number;
  rateLimitFailures: number;
  totalLatencyMs: number;
}

interface ProviderState {
  failures: number;
  openUntil: number;
  cooldownMs: number;
  quarantineUntil: number;
  stats: ProviderStats;
}

const DEFAULT_STATS: ProviderStats = {
  requests: 0,
  successes: 0,
  validationFailures: 0,
  parseFailures: 0,
  transportFailures: 0,
  timeoutFailures: 0,
  rateLimitFailures: 0,
  totalLatencyMs: 0,
};

const BASE_PRIORITY: Record<ProviderName, number> = {
  NVIDIA: 100,
  Groq: 95,
  Anthropic: 90,
};

export class ProviderHealthManager {
  private readonly states = new Map<ProviderName, ProviderState>();

  private state(provider: ProviderName): ProviderState {
    const existing = this.states.get(provider);
    if (existing) return existing;
    const created: ProviderState = {
      failures: 0,
      openUntil: 0,
      cooldownMs: 10_000,
      quarantineUntil: 0,
      stats: { ...DEFAULT_STATS },
    };
    this.states.set(provider, created);
    return created;
  }

  canAttempt(provider: ProviderName, now = Date.now()): boolean {
    const s = this.state(provider);
    if (s.quarantineUntil > now) return false;
    return s.openUntil <= now;
  }

  recordSuccess(provider: ProviderName, latencyMs: number): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.successes++;
    s.stats.totalLatencyMs += Math.max(0, latencyMs);
    s.failures = 0;
    s.openUntil = 0;
    s.cooldownMs = Math.max(10_000, Math.floor(s.cooldownMs / 2));
  }

  recordValidationFailure(provider: ProviderName): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.validationFailures++;
    const totalFailures = s.stats.validationFailures + s.stats.parseFailures + s.stats.transportFailures + s.stats.timeoutFailures;
    const failureRate = totalFailures / Math.max(1, s.stats.requests);
    if (s.stats.validationFailures >= 8 && failureRate > 0.45) {
      s.quarantineUntil = Date.now() + 10 * 60_000;
      return;
    }
    this.tripCircuit(s);
  }

  recordParseFailure(provider: ProviderName): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.parseFailures++;
    if (s.stats.parseFailures >= 5 && s.stats.successes === 0) {
      s.quarantineUntil = Date.now() + 5 * 60_000;
    }
  }

  recordTransportFailure(provider: ProviderName): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.transportFailures++;
    this.tripCircuit(s);
  }

  recordTimeoutFailure(provider: ProviderName): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.timeoutFailures++;
    this.tripCircuit(s);
  }

  recordRateLimitFailure(provider: ProviderName, quotaExceeded: boolean): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.rateLimitFailures++;
    if (quotaExceeded) {
      s.quarantineUntil = Date.now() + 15 * 60_000;
      return;
    }
    this.tripCircuit(s);
  }

  orderedProviders(candidates: ProviderName[]): ProviderName[] {
    return [...candidates].sort((a, b) => this.score(b) - this.score(a));
  }

  statsSnapshot(): Record<string, ProviderStats & { score: number; circuitOpen: boolean; quarantined: boolean }> {
    const now = Date.now();
    const result: Record<string, ProviderStats & { score: number; circuitOpen: boolean; quarantined: boolean }> = {};
    for (const [provider, state] of this.states.entries()) {
      result[provider] = {
        ...state.stats,
        score: this.score(provider),
        circuitOpen: state.openUntil > now,
        quarantined: state.quarantineUntil > now,
      };
    }
    return result;
  }

  reset(provider: ProviderName): void {
    this.states.delete(provider);
  }

  resetAll(): void {
    this.states.clear();
  }

  private tripCircuit(state: ProviderState): void {
    state.failures++;
    if (state.failures < 3) return;
    state.openUntil = Date.now() + state.cooldownMs;
    state.cooldownMs = Math.min(state.cooldownMs * 2, 120_000);
  }

  private score(provider: ProviderName): number {
    const s = this.state(provider);
    const stats = s.stats;
    const avgLatency = stats.successes > 0 ? stats.totalLatencyMs / stats.successes : 60_000;
    return (
      BASE_PRIORITY[provider] +
      stats.successes * 5 -
      stats.validationFailures * 2 -
      stats.parseFailures * 3 -
      stats.transportFailures * 4 -
      stats.timeoutFailures * 5 -
      stats.rateLimitFailures * 4 -
      Math.floor(avgLatency / 1000)
    );
  }
}
