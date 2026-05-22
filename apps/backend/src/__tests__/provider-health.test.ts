import { describe, expect, it } from 'vitest';
import { ProviderHealthManager } from '../services/ai/provider-health';

describe('ProviderHealthManager', () => {
  it('does not open circuit on validation-only failures', () => {
    const manager = new ProviderHealthManager();
    manager.recordValidationFailure('NVIDIA');
    manager.recordValidationFailure('NVIDIA');
    manager.recordValidationFailure('NVIDIA');

    expect(manager.canAttempt('NVIDIA')).toBe(true);
  });

  it('opens circuit on repeated timeout failures', () => {
    const manager = new ProviderHealthManager();
    manager.recordTimeoutFailure('NVIDIA');
    manager.recordTimeoutFailure('NVIDIA');
    manager.recordTimeoutFailure('NVIDIA');

    expect(manager.canAttempt('NVIDIA')).toBe(false);
  });
});
