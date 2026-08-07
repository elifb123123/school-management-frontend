/** Backend branch values are enum names like "MATHEMATICS" — render them Title Case. */
export function formatBranch(branch: string): string {
  if (!branch) {
    return branch;
  }
  return branch.charAt(0) + branch.slice(1).toLowerCase();
}
