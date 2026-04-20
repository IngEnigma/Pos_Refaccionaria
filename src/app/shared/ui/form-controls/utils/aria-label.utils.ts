export function resolveAriaLabel(
  hasVisibleLabel: boolean,
  ariaLabel: string,
  placeholder: string,
  fallback: string
): string | null {
  if (hasVisibleLabel) {
    return null;
  }

  const aria = ariaLabel?.trim();
  if (aria) {
    return aria;
  }

  const p = placeholder?.trim();
  if (p) {
    return p;
  }

  return fallback;
}
