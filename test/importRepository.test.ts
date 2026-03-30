import { describe, it, expect, vi, beforeEach } from "vitest";
import * as importRepository from "../src/repositories/importRepository";

describe("importRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have parseImport function", () => {
    expect(typeof importRepository.parseImport).toBe("function");
  });
});
