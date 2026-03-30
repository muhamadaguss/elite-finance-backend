import { describe, it, expect, vi, beforeEach } from "vitest";
import * as categoryRepository from "../src/repositories/categoryRepository";

describe("categoryRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have listCategoriesWithMeta function", () => {
    expect(typeof categoryRepository.listCategoriesWithMeta).toBe("function");
  });
});
