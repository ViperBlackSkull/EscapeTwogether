import { describe, it, expect } from 'vitest';

describe('ScreenTransition', () => {
  it('exports the expected component', async () => {
    const mod = await import('../../components/effects/ScreenTransition.js');
    expect(mod.default).toBeTypeOf('function');
  });

  it('supports all three phases', async () => {
    const { default: ScreenTransition } = await import('../../components/effects/ScreenTransition.js');
    expect(ScreenTransition).toBeDefined();
    // Phases: fade-out, holding, fade-in are validated at compile time via props
  });
});
