import { describe, it, expect } from 'vitest';

describe('LandingPage', () => {
  it('exports the component as default', async () => {
    const mod = await import('../../pages/LandingPage.js');
    expect(mod.default).toBeTypeOf('function');
  });

  it('module loads without error', async () => {
    const mod = await import('../../pages/LandingPage.js');
    expect(mod.default).toBeDefined();
  });
});
