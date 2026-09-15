import type { Side } from "./types";

/** Operated ACL knee. Used to label laterality in session logging. */
export const ACL_SIDE: Side = "left";

export function isAclSide(side: Side): boolean {
  return side === ACL_SIDE;
}

export function formatSide(side: Side, compact = false): string {
  if (side === "none") return "";
  const name = compact
    ? side === "left"
      ? "L"
      : "R"
    : side === "left"
      ? "Left"
      : "Right";
  return isAclSide(side) ? `${name} ACL` : name;
}
