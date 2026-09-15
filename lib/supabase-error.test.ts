import { describe, expect, it } from "vitest";
import { describeSupabaseError, isMissingPrivilegeError } from "./supabase-error";

describe("isMissingPrivilegeError", () => {
  it("recognises a Postgres 42501 from the Data API", () => {
    expect(
      isMissingPrivilegeError({
        code: "42501",
        message: "permission denied for table programmes",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isMissingPrivilegeError(new Error("relation does not exist"))).toBe(
      false,
    );
  });
});

describe("describeSupabaseError", () => {
  it("tells you to use the service_role key", () => {
    expect(
      describeSupabaseError({
        code: "42501",
        message: "permission denied for table programmes",
      }),
    ).toMatch(/service_role/);
  });

  it("tells you to run setup SQL when tables are missing", () => {
    expect(
      describeSupabaseError(new Error('relation "programmes" does not exist')),
    ).toMatch(/setup\.sql/);
  });
});
