import { describe, expect, it } from "vitest";

import { isAuthPage, isProtectedPath } from "@/lib/auth/paths";

describe("isProtectedPath", () => {
  it("matches /app and nested routes", () => {
    expect(isProtectedPath("/app")).toBe(true);
    expect(isProtectedPath("/app/settings")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/signup")).toBe(false);
    expect(isProtectedPath("/apple")).toBe(false);
  });
});

describe("isAuthPage", () => {
  it("matches login and signup only", () => {
    expect(isAuthPage("/login")).toBe(true);
    expect(isAuthPage("/signup")).toBe(true);
    expect(isAuthPage("/app")).toBe(false);
  });
});
