import { describe, it, expect, vi, beforeEach } from "vitest";
import * as analyticsService from "../src/services/analyticsService";
import * as analyticsRepository from "../src/repositories/analyticsRepository";

describe("analyticsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call analyticsRepository.getMonthlySummary", async () => {
    const spy = vi
      .spyOn(analyticsRepository, "getMonthlySummary")
      .mockResolvedValue({});
    await analyticsService.getMonthlySummary(
      { user: { id: "u1" }, query: { month: "2026-03" } },
      { json: vi.fn() },
    );
    expect(spy).toHaveBeenCalledWith("u1", "2026-03");
  });

  // Add more tests for getSpendingByCategory, getMonthlyTrend, etc.
});
