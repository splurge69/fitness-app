import { describe, expect, it } from "vitest";
import { ACL_SIDE, formatSide, isAclSide } from "./rehab";

describe("ACL side", () => {
  it("is the left knee", () => {
    expect(ACL_SIDE).toBe("left");
    expect(isAclSide("left")).toBe(true);
    expect(isAclSide("right")).toBe(false);
    expect(formatSide("left", true)).toBe("L ACL");
    expect(formatSide("right")).toBe("Right");
  });
});
