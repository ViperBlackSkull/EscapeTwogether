import { describe, it, expect } from 'vitest';

describe('ParticleField', () => {
  it('exports the expected component', async () => {
    const mod = await import('../../components/effects/ParticleField.js');
    expect(mod.default).toBeTypeOf('function');
  });

  it('module loads without error', async () => {
    const mod = await import('../../components/effects/ParticleField.js');
    expect(mod.default).toBeDefined();
  });
});
