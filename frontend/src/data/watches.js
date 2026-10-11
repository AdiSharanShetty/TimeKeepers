// ---------------------------------------------------------------------------
// Watch extras — description/specs the DB does not provide.
//
// The catalogue itself (id, name, brand, price, image) lives in the database
// and is loaded from GET /api/products (see src/api/products.js, consumed via
// src/utils/useProducts.js). This file holds ONLY the extra fields the DB
// lacks: a rich description, a spec sheet, and a brand fallback — keyed by the
// REAL product id returned by the API (currently 1-8).
//
// Components must always look extras up with getWatchExtras(product.id) using
// the id that came from the API; an unknown id simply gets no extras and the
// UI falls back to the DB fields.
// ---------------------------------------------------------------------------

export const watchExtras = {
  1: {
    brand: 'Rolex',
    description:
      'The Submariner is Rolex’s iconic dive watch, first introduced in 1953 and worn by explorers and professional divers ever since. Its Oyster case is waterproof to 300 metres and houses a self-winding Perpetual movement. A unidirectional bezel and luminous markers keep it readable at any depth.',
    specs: {
      caseSize: '41 mm',
      movement: 'Automatic (Perpetual)',
      waterResistance: '300 m',
      strap: 'Oyster steel bracelet',
      crystal: 'Sapphire',
    },
  },
  2: {
    brand: 'Omega',
    description:
      'The Speedmaster Professional earned its legend on the wrist of NASA astronauts during the Apollo missions. This manual-wind chronograph pairs a 42 mm stainless steel case with Omega’s Co-Axial movement for modern precision. Its tachymeter bezel and chronograph dials stay true to the original Moon watch design.',
    specs: {
      caseSize: '42 mm',
      movement: 'Manual-wind chronograph',
      waterResistance: '50 m',
      strap: 'Stainless steel bracelet',
      crystal: 'Sapphire',
    },
  },
  3: {
    brand: 'Casio',
    description:
      'Built to survive drops, shocks and water, the G-Shock is Casio’s legendary tough watch. A 200-metre water-resistant resin case cushions the module against impacts, while the hybrid display keeps time, alarms and a stopwatch at a glance. It is the go-to watch for the outdoors and everyday abuse.',
    specs: {
      caseSize: '45.4 mm',
      movement: 'Quartz (battery)',
      waterResistance: '200 m',
      strap: 'Resin strap',
      crystal: 'Mineral glass',
    },
  },
  4: {
    brand: 'Seiko',
    description:
      'The Presage line blends Japanese mechanical watchmaking with refined dress-watch styling. A polished stainless steel case and intricately crafted dial showcase the attention to detail Seiko is known for. Powered by a reliable automatic movement, it is an elegant everyday companion.',
    specs: {
      caseSize: '40.5 mm',
      movement: 'Automatic',
      waterResistance: '50 m',
      strap: 'Leather strap',
      crystal: 'Hardlex',
    },
  },
  5: {
    brand: 'Rolex',
    description:
      'The Sea Gold pairs a sumptuous gold-toned finish with the sporty silhouette of a classic sea watch. Its striking case and bracelet are made for those who want their wristwear to command attention. A premium statement piece for collectors with bold taste.',
    specs: {
      caseSize: '40 mm',
      movement: 'Automatic',
      waterResistance: '100 m',
      strap: 'Gold-tone bracelet',
      crystal: 'Sapphire',
    },
  },
  6: {
    brand: 'Seiko',
    description:
      'A faithful homage to Seiko’s celebrated 1968 diver, this Heritage model captures the bold case and dial of the original. Inside, a reliable automatic movement delivers dependable accuracy for everyday wear. With 200 metres of water resistance and a uni-directional bezel, it is a true tool watch.',
    specs: {
      caseSize: '44.9 mm',
      movement: 'Automatic',
      waterResistance: '200 m',
      strap: 'Silicone strap',
      crystal: 'Sapphire',
    },
  },
  7: {
    brand: 'Casio',
    description:
      'A playful collaboration between G-Shock and Coca-Cola, finished in the brand’s signature red. It keeps the legendary shock-resistant build and 200-metre water resistance of the G-Shock line. A fun collector’s piece for fans of both brands.',
    specs: {
      caseSize: '49.6 mm',
      movement: 'Quartz (battery)',
      waterResistance: '200 m',
      strap: 'Resin strap',
      crystal: 'Mineral glass',
    },
  },
  8: {
    brand: 'Roamer',
    description:
      'The Roamer Premier pairs a classic analog dial with a Swiss automatic movement in a slim, elegant case. A fine leather strap completes its timeless dress-watch character. Ideal for business wear and formal occasions.',
    specs: {
      caseSize: '40 mm',
      movement: 'Automatic (Swiss)',
      waterResistance: '50 m',
      strap: 'Leather strap',
      crystal: 'Sapphire',
    },
  },
};

/**
 * Look up the extra fields for a product by its REAL id (from the API).
 * @param {number|string} id - product id from /api/products
 * @returns {{brand?: string, description?: string, specs?: object}|null}
 */
export function getWatchExtras(id) {
  const key = Number(id);
  if (!Number.isFinite(key)) return null;
  return watchExtras[key] || null;
}

export default watchExtras;
