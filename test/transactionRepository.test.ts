import { describe, it, expect, vi, beforeEach } from "vitest";
import * as transactionRepository from "../src/repositories/transactionRepository";

describe("transactionRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have listTransactions function", () => {
    expect(typeof transactionRepository.listTransactions).toBe("function");
  });
});
