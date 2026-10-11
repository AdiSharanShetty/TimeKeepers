// Single source of truth for turning a product's stored `image` value into a
// displayable URL, plus the shared fallback for missing/broken images.
//
// DECIDED image convention (Phase 0, agreed with backend):
//   `image` stores the BARE FILENAME, e.g. `Rolex_sea_gold.png`.
//   The frontend serves it from `public/images/`, so the URL is `/images/<file>`.
//   The backend seed script (`backend/scripts/seedProductImages.js`) normalizes
//   `product.image` to this bare-filename form.
//
// This helper stays tolerant of other shapes so the UI never breaks:
//   * absolute URLs (http/https/data)  -> used as-is
//   * `/`-prefixed paths               -> used as-is
//   * legacy `uploads/<ts>-<name>`     -> stripped to the bare filename and
//                                          resolved against `/images/`
//
// If the storage convention ever changes, ONLY this file needs to change.

// Shown when a product has no image, or when its image fails to load (onError).
export const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

// Strip any leading directories and an optional `<timestamp>-` upload prefix,
// leaving just the bare filename (e.g. `17846...-Rolex_sea_gold.png` ->
// `Rolex_sea_gold.png`).
function toBareFilename(value) {
  const withoutDirs = value.replace(/\\/g, '/').split('/').pop() || '';
  // Remove a leading run of digits followed by a dash (multer's `Date.now()-`).
  return withoutDirs.replace(/^\d+-/, '');
}

/**
 * Build a displayable image URL from a product's stored image value.
 * @param {string|null|undefined} image - value from the API.
 * @returns {string} a URL safe to use in an <img src="...">.
 */
export function getImageUrl(image) {
  if (!image || typeof image !== 'string') {
    return PLACEHOLDER_IMAGE;
  }

  const value = image.trim();
  if (!value) {
    return PLACEHOLDER_IMAGE;
  }

  // Already absolute (http/https), protocol-relative, or a data URI -> use as-is.
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  // Absolute path from the frontend's own public/ folder -> use as-is.
  if (value.startsWith('/')) {
    return value;
  }

  // Bare filename (the agreed convention) OR a legacy stored path: resolve the
  // bare filename against the public `/images/` folder.
  const filename = toBareFilename(value);
  if (!filename) {
    return PLACEHOLDER_IMAGE;
  }
  return `/images/${encodeURIComponent(filename)}`;
}

