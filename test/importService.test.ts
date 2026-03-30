import { describe, it, expect, vi, beforeEach } from "vitest";
import * as importService from "../src/services/importService";
import * as importRepository from "../src/repositories/importRepository";

describe("importService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call importRepository.parseImport", async () => {
    const spy = vi
      .spyOn(importRepository, "parseImport")
      .mockResolvedValue({ transactions: [], totalFound: 0, parseErrors: [] });
    await importService.parseImport(
      { user: { id: "u1" }, body: { content: "", format: "csv" } },
      { json: vi.fn() },
    );
    expect(spy).toHaveBeenCalledWith("u1", "", "csv");
  });

  // Add more tests for confirmImport, etc.
});
