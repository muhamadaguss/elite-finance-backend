import { describe, it, expect, vi, beforeEach } from "vitest";
import * as assetService from "../src/services/assetService";
import * as assetRepository from "../src/repositories/assetRepository";

describe("assetService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call assetRepository.listAssets", async () => {
    const spy = vi.spyOn(assetRepository, "listAssets").mockResolvedValue([]);
    await assetService.listAssets({ user: { id: "u1" } }, { json: vi.fn() });
    expect(spy).toHaveBeenCalledWith("u1");
  });

  // Add more tests for create, update, delete, etc.
});
