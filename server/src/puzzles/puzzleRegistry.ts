import type { PuzzleBase } from './puzzleBase.js';

type PuzzleConstructor = new () => PuzzleBase;

const registry = new Map<string, PuzzleConstructor>();

export function registerPuzzle(constructor: PuzzleConstructor): void {
  const instance = new constructor();
  const type = instance.type;

  if (!type) {
    throw new Error(`Puzzle ${constructor.name} must have a non-empty "type" property`);
  }

  const required = ['id', 'type', 'name', 'description'] as const;
  for (const prop of required) {
    if (!(prop in instance)) {
      throw new Error(`Puzzle "${constructor.name}" missing required property: "${prop}"`);
    }
  }

  for (const method of ['onGenerate', 'onValidateAction', 'getHint'] as const) {
    if (typeof (instance as any)[method] !== 'function') {
      throw new Error(`Puzzle "${constructor.name}" missing required method: "${method}"`);
    }
  }

  if (registry.has(type)) {
    throw new Error(`Puzzle type "${type}" is already registered`);
  }

  registry.set(type, constructor);
}

export function createPuzzle(type: string): PuzzleBase | undefined {
  const ctor = registry.get(type);
  if (!ctor) return undefined;
  return new ctor();
}

export function getAllTypes(): string[] {
  return Array.from(registry.keys());
}

export function getRegisteredPuzzles(): { type: string; name: string; description: string }[] {
  return Array.from(registry.values()).map((Ctor) => {
    const instance = new Ctor();
    return { type: instance.type, name: instance.name, description: instance.description };
  });
}
