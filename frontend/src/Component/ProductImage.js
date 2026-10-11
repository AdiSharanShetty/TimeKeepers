import React, { useState } from 'react';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageUrl';

/**
 * <ProductImage> renders a product image from its stored `image` value using the
 * shared getImageUrl() helper. If the image is missing or fails to load, it falls
 * back to a placeholder automatically (no broken-image icons).
 *
 * Usage:
 *   <ProductImage image={product.image} alt={product.pname} className="..." />
 */
function ProductImage({
  image,
  alt = '',
  className,
  style,
  width,
  height,
  ...rest
}) {
  const [src, setSrc] = useState(() => getImageUrl(image));

  const handleError = () => {
    // Only swap once; avoids an infinite loop if the placeholder itself is missing.
    if (src !== PLACEHOLDER_IMAGE) {
      setSrc(PLACEHOLDER_IMAGE);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      onError={handleError}
      loading="lazy"
      {...rest}
    />
  );
}

export default ProductImage;
