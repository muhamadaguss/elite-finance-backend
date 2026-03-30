import { describe, it, expect, vi, beforeEach } from "vitest";
import * as assetRepository from "../src/repositories/assetRepository";

describe("assetRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have listAssets function", () => {
    expect(typeof assetRepository.listAssets).toBe("function");
  });
});
