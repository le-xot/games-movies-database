import { mock } from 'bun:test';

export function createMock<T>(Type: abstract new (...args: any[]) => T): T {
  const target = Object.create(Type.prototype) as T;
  const mockedKeys = new Set<string>();

  for (const key of Object.getOwnPropertyNames(Type.prototype)) {
    if (key === 'constructor') {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(Type.prototype, key);
    if (descriptor?.value instanceof Function) {
      (target as Record<string, unknown>)[key] = mock(() => undefined);
      mockedKeys.add(key);
    }
  }

  return new Proxy(target as Record<string, unknown>, {
    get(object, key) {
      if (typeof key !== 'string') {
        return Reflect.get(object, key);
      }

      if (key in object) {
        return Reflect.get(object, key);
      }

      if (mockedKeys.has(key)) {
        return Reflect.get(object, key);
      }

      const value = mock(() => undefined);
      object[key] = value;
      return value;
    },
  }) as T;
}
