/**
 * Utility functions for generating and resolving SEO-friendly URL slugs
 * for pharmacies and clinical services across NextDoorClinic.
 */

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // separate accent marks
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace to hyphen
    .replace(/-+/g, "-") // collapse hyphens
    .replace(/^-+/, "") // trim starting hyphens
    .replace(/-+$/, ""); // trim ending hyphens
}

export function getServiceUrl(pharmacySlug: string, serviceNameOrSlug: string): string {
  const pSlug = slugify(pharmacySlug);
  const sSlug = slugify(serviceNameOrSlug);
  return `/${pSlug}/${sSlug}`;
}

export function matchServiceSlug(
  serviceName: string,
  serviceSlug: string | null | undefined,
  targetSlug: string
): boolean {
  const cleanTarget = targetSlug.toLowerCase().trim();
  if (serviceSlug && serviceSlug.toLowerCase().trim() === cleanTarget) {
    return true;
  }
  return slugify(serviceName) === cleanTarget;
}
