import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../../style.css';
import UserMenu from '../../Component/UserMenu';
import ProductImage from '../../Component/ProductImage';
import useProducts from '../../utils/useProducts';
import { getWatchExtras } from '../../data/watches';
import { useCartActions } from '../../utils/cart';
import { useCart } from '../../context/CartContext';

function WatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { count } = useCart();
  const { addToCart, buyNow } = useCartActions();
  const { products, loading, error } = useProducts();
  const [quantity, setQuantity] = useState(1);

  // Find the product by the REAL id from the API (never assume ids 1-8).
  const product = products.find((p) => String(p.id) === String(id));

  // Extras (description/specs/brand fallback) for this id; null when unknown.
  const extras = product ? getWatchExtras(product.id) : null;

  const description =
    extras?.description || product?.description || 'No description available.';
  const brand = product?.brand || extras?.brand || '';
  const specs = extras?.specs || null;

  const related = product
    ? products.filter((p) => p.id !== product.id).slice(0, 4)
    : [];

  const handleAddToCart = () => addToCart(product, quantity);
  const handleBuyNow = () => buyNow(navigate, product, quantity);

  return (
    <div>
      {/* Header — same structure/styling as the home page */}
      <div className="site-header">
        <div className="container header-inner">
          <Link to="/Home" className="logo">
            TIME <span>KEEPERS</span>
          </Link>
          <nav className="main-nav">
            <a href="/Home#plans">Pricing Plans</a>
            <a href="/Home#featured">Shop</a>
            <a href="/Home#about">About Us</a>
            <a href="/Home#faq">FAQ</a>
            <a href="/Home#contact">Contact</a>
          </nav>
          <div className="header-actions">
            <button
              className="btn btn-gold btn-sm"
              onClick={() => navigate('/Home')}
            >
              Buy Now
            </button>
            <button
              className="btn btn-dark btn-sm"
              style={{ borderColor: '#33302a' }}
              onClick={() => navigate('/cart')}
            >
              Your Cart ({count})
            </button>
            <UserMenu />
            <button className="icon-btn" aria-label="Search" onClick={() => navigate('/Home')}>
              <i className="fas fa-search"></i>
            </button>
            <button className="icon-btn burger" aria-label="Menu">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="watch-detail">
        <div className="container">
          {loading && <p className="watch-status">Loading…</p>}

          {!loading && error && (
            <p className="watch-status watch-error">{error}</p>
          )}

          {!loading && !error && !product && (
            <div className="watch-not-found">
              <h2>Watch not found</h2>
              <p>
                The watch you are looking for does not exist or may have been
                removed.
              </p>
              <Link to="/Home" className="btn btn-gold">
                Back to shop
              </Link>
            </div>
          )}

          {!loading && !error && product && (
            <>
              <Link to="/Home" className="back-to-shop">
                <i className="fas fa-arrow-left"></i> Back to shop
              </Link>

              <div className="watch-detail-grid">
                <div className="watch-detail-media">
                  <ProductImage image={product.image} alt={product.name} />
                </div>

                <div className="watch-detail-info">
                  {brand && <p className="eyebrow">{brand}</p>}
                  <h1>{product.name}</h1>
                  <p className="price">
                    ${Number(product.price || 0).toLocaleString()}
                  </p>
                  <p className="watch-desc">{description}</p>

                  {specs && (
                    <table className="watch-specs">
                      <tbody>
                        <tr>
                          <th>Case Size</th>
                          <td>{specs.caseSize}</td>
                        </tr>
                        <tr>
                          <th>Movement</th>
                          <td>{specs.movement}</td>
                        </tr>
                        <tr>
                          <th>Water Resistance</th>
                          <td>{specs.waterResistance}</td>
                        </tr>
                        <tr>
                          <th>Strap</th>
                          <td>{specs.strap}</td>
                        </tr>
                        <tr>
                          <th>Crystal</th>
                          <td>{specs.crystal}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  <div className="watch-buy-row">
                    <span className="watch-qty-label">Quantity</span>
                    <div className="qty-selector">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                        disabled={quantity >= 99}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="watch-actions">
                    <button className="btn btn-outline" onClick={handleAddToCart}>
                      ADD TO CART
                    </button>
                    <button className="btn btn-dark" onClick={handleBuyNow}>
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>

              {related.length > 0 && (
                <section className="related">
                  <div className="section-title">
                    <span className="eyebrow">More timepieces</span>
                    <h2>You may also like</h2>
                  </div>
                  <div className="product-grid related-grid">
                    {related.map((item, index) => (
                      <article className="product-card" key={item.id}>
                        <span className="badge">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div
                          className="product-img"
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(`/watch/${item.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') navigate(`/watch/${item.id}`);
                          }}
                        >
                          <ProductImage image={item.image} alt={item.name} />
                        </div>
                        <h3
                          className="product-title"
                          onClick={() => navigate(`/watch/${item.id}`)}
                        >
                          {item.name}
                        </h3>
                        <p className="price">
                          ${Number(item.price || 0).toLocaleString()}
                        </p>
                        <div className="product-actions">
                          <button
                            className="btn btn-outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item, 1);
                            }}
                          >
                            ADD TO CART
                          </button>
                          <button
                            className="btn btn-dark"
                            onClick={(e) => {
                              e.stopPropagation();
                              buyNow(navigate, item, 1);
                            }}
                          >
                            BUY NOW
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WatchDetails;
