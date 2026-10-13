export function pagesBase(repository?: string, override?: string): string {
  if (override) {
    if (
      !override.startsWith("/") ||
      override.startsWith("//") ||
      !override.endsWith("/")
    )
      throw new Error(
        "PAGES_BASE_PATH deve começar e terminar com /, por exemplo /metas/.",
      );
    return override;
  }
  const repo = repository?.split("/")[1];
  return repo && !repo.toLowerCase().endsWith(".github.io") ? `/${repo}/` : "/";
}
