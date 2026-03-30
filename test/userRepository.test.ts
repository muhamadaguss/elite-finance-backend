import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userRepository from "../src/repositories/userRepository";

describe("userRepository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have findByEmail function", () => {
    expect(typeof userRepository.findByEmail).toBe("function");
  });
});
