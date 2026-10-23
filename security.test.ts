
import { describe, it, expect } from "vitest";

describe("AuthenCrypt security checks", () => {
  it("rejects unauthenticated document access", async () => {
    const response = await fetch(
      "http://localhost:3000/api/documents"
    );

    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated audit access", async () => {
    const response = await fetch(
      "http://localhost:3000/api/audit"
    );

    expect(response.status).toBe(401);
  });
});
