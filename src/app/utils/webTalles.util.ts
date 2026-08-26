/** Talles de ropa estándar en ecommerce (excluye OS espurio de parseo MEL OS). */
const STANDARD_WEB_TALLES = new Set([
  '2XS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46',
  '48',
  '50',
  '52',
  '54',
  '56',
]);

/**
 * Quita OS del selector cuando hay talles reales (S/M/L…).
 * OS legítimo solo se mantiene si es el único talle del producto.
 */
export function filterTallesForWebSelector(talles: string[]): string[] {
  const unique = Array.from(new Set(talles.filter(Boolean)));
  const hasStandard = unique.some((t) => STANDARD_WEB_TALLES.has(t.toUpperCase()));
  if (!hasStandard) return unique;
  return unique.filter((t) => t.toUpperCase() !== 'OS');
}
