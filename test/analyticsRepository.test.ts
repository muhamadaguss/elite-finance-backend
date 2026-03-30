import { describe, it, expect, vi, beforeEach } from "vitest";
import * as analyticsRepository from "../src/repositories/analyticsRepository";

describe("analyticsRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have getMonthlySummary function", () => {
    expect(typeof analyticsRepository.getMonthlySummary).toBe("function");
  });
});
