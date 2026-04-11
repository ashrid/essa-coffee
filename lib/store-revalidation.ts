import { revalidatePath } from "next/cache";

function dedupeAndSort(paths: string[]): string[] {
  return [...new Set(paths)].sort();
}

export function getProductStorefrontPaths({
  previousSlug,
  nextSlug,
}: {
  previousSlug?: string | null;
  nextSlug?: string | null;
}): string[] {
  return dedupeAndSort([
    "/",
    "/shop",
    previousSlug ? `/shop/${previousSlug}` : "",
    nextSlug ? `/shop/${nextSlug}` : "",
  ].filter(Boolean));
}

export function getCategoryStorefrontPaths(productSlugs: string[]): string[] {
  return dedupeAndSort([
    "/",
    "/shop",
    ...productSlugs.map((slug) => `/shop/${slug}`),
  ]);
}

export function revalidateStorefrontPaths(paths: string[]) {
  for (const path of paths) {
    if (path.startsWith("/shop/")) {
      revalidatePath(path, "page");
      continue;
    }

    revalidatePath(path);
  }
}
