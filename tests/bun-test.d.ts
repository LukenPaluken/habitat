// Minimal typings for the `bun:test` functions these tests use, so `tsc` (and
// the CI typecheck) understand them. If `@types/bun` is ever added to the
// project, delete this file: it provides the real ones.
declare module "bun:test" {
  interface Matchers {
    not: Matchers;
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: unknown): void;
    toHaveLength(length: number): void;
    toBeGreaterThan(value: number): void;
    toBeGreaterThanOrEqual(value: number): void;
    toBeLessThan(value: number): void;
    toBeInstanceOf(type: abstract new (...args: never[]) => unknown): void;
    toMatch(pattern: RegExp | string): void;
  }
  type Hook = () => void | Promise<void>;
  export function describe(name: string, body: () => void): void;
  export function it(name: string, body: () => void | Promise<void>): void;
  export function beforeAll(hook: Hook): void;
  export function afterAll(hook: Hook): void;
  export function expect(value: unknown): Matchers;
}
