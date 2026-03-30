import { describe, it, expect, vi, beforeEach } from "vitest";
import * as categoryService from "../src/services/categoryService";
import * as categoryRepository from "../src/repositories/categoryRepository";

describe("categoryService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call categoryRepository.listCategoriesWithMeta", async () => {
    const spy = vi
      .spyOn(categoryRepository, "listCategoriesWithMeta")
      .mockResolvedValue([]);
    await categoryService.listCategories(
      { user: { id: "u1" } },
      { json: vi.fn() },
    );
    expect(spy).toHaveBeenCalledWith("u1");
  });

  // Add more tests for create, update, delete, etc.
});
