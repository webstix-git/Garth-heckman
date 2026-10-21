export function replaceQuery(
  pathname: string,
  current: URLSearchParams,
  patch: Record<string, string | null | undefined>,
) {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
