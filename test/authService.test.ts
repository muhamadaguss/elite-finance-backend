import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authService from "../src/services/authService";
import * as userRepository from "../src/repositories/userRepository";

describe("authService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call userRepository.findByEmail on login", async () => {
    const spy = vi.spyOn(userRepository, "findByEmail").mockResolvedValue(null);
    await authService.login(
      { body: { email: "test@example.com", password: "123" } },
      { json: vi.fn(), status: vi.fn().mockReturnThis() },
    );
    expect(spy).toHaveBeenCalledWith("test@example.com");
  });

  // Add more tests for register, getUser, etc.
});
