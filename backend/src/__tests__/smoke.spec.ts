import { describe, expect, it } from 'bun:test';

import { createMock } from './helpers/mock-factory';

describe('smoke', () => {
  it('passes a basic arithmetic check', () => {
    expect(1 + 1).toBe(2);
  });

  it('creates callable method mocks for abstract classes', () => {
    abstract class ExampleRepository {
      abstract findById(id: number): string | undefined;
    }

    const mockRepository = createMock(ExampleRepository);
    const result = mockRepository.findById(123);

    expect(result).toBeUndefined();
    expect(mockRepository.findById).toHaveBeenCalledTimes(1);
  });
});
