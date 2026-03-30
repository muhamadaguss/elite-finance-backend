import { describe, it, expect, vi, beforeEach } from "vitest";
import * as transactionService from "../src/services/transactionService";
import * as transactionRepository from "../src/repositories/transactionRepository";

describe("transactionService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call transactionRepository.listTransactions", async () => {
    const spy = vi
      .spyOn(transactionRepository, "listTransactions")
      .mockResolvedValue([]);
    const req = { user: { id: "u1" } };
    const res = { json: vi.fn() };
    await transactionService.listTransactions(req, res);
    expect(spy).toHaveBeenCalledWith(req, res);
  });

  // Add more tests for create, update, delete, etc.
});
