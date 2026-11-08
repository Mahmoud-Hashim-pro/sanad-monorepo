declare module "node:test" {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
}

declare module "node:assert/strict" {
  function equal<T>(actual: T, expected: T, message?: string): void;
  function ok(value: unknown, message?: string): asserts value;
  function throws(block: () => unknown, message?: string | RegExp): void;
  const assert: {
    equal: typeof equal;
    ok: typeof ok;
    throws: typeof throws;
  };
  export default assert;
}
