import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../style.css';
import UserMenu from '../../Component/UserMenu';
import SearchBar from '../../Component/SearchBar';
import ProductImage from '../../Component/ProductImage';
import useProducts from '../../utils/useProducts';
import { useCartActions } from '../../utils/cart';
import { useCart } from '../../context/CartContext';

function Home() {
  const navigate = useNavigate();
  const { count } = useCart();
  const { addToCart, buyNow } = useCartActions();

  // Shared product list — loaded once and reused by the detail page (and search).
  const { products, loading: productsLoading, error: productsError } = useProducts();

  // --- Search card (Section 4) -------------------------------------------
  // The text query lives inside SearchBar; the Brand and Price Range selects
  // live here and are passed down so they filter the dropdown results too.
  const [brandFilter, setBrandFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const searchInputRef = useRef(null);
  const searchNowRef = useRef(null);

  // Brands are derived from the catalogue so the select can never go stale.
  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );

  // Header magnifying-glass: focus and reveal the hero search input.
  const focusSearchInput = () => {
    const input = searchInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // SEARCH NOW opens the highlighted dropdown row, or the top match.
  const handleSearchNow = () => {
    if (searchNowRef.current) searchNowRef.current();
  };

  const handleAddToCart = (product) => addToCart(product, 1);

  const handleBuyNow = (product) => buyNow(navigate, product, 1);


return (
<>
<div>
  <header className="site-header">
    <div className="container header-inner">
      <a href="#" className="logo">TIME <span>KEEPERS</span></a>
      <nav className="main-nav" id="mainNav">
        <a href="#plans">Pricing Plans</a>
        <a href="#featured">Shop</a>
        <a href="#categories">Feature</a>
        <a href="#testimonials">Blog</a>
        <a href="#contact">Contact</a>
      </nav>
      <div className="header-actions">
        <a href="#plans" className="btn btn-gold btn-sm">Buy Now</a>
        <button type="button" onClick={() => navigate('/cart')} className='btn btn-gold btn-sm'>Your Cart ({count})</button>
        <UserMenu />
        <button className="icon-btn" id="searchToggle" aria-label="Search" onClick={focusSearchInput}><i className="fa-solid fa-magnifying-glass" /></button>
        <button className="icon-btn burger" id="navToggle" aria-label="Menu"><i className="fa-solid fa-bars" /></button>
      </div>
    </div>
  </header>
  {/* ============ HERO ============ */}
  <section className="hero">
    <div className="hero-blob" />
    <div className="container hero-inner">
      <div className="hero-copy">
        <p className="eyebrow">— Est. 2024</p>
        <h1>LUXURY WATCHES.<br /><span>TIMELESS STYLE.</span></h1>
        <p className="hero-text">Discover premium watches for every occasion, from everyday elegance to luxury craftsmanship.</p>
        <a href="#featured" className="btn btn-gold">Shop Now</a>
      </div>
      <div className="hero-media">
        <button className="slide-arrow left" id="heroPrev" aria-label="Previous"><i className="fa-solid fa-chevron-left" /></button>
        <img src="https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=900&q=80" alt="Collection of three luxury watches on a marble stand" id="heroImg" />
        <button className="slide-arrow right" id="heroNext" aria-label="Next"><i className="fa-solid fa-chevron-right" /></button>
      </div>
      <button className="play-btn" id="playBtn" aria-label="Play video"><i className="fa-solid fa-play" /></button>
    </div>
    <div className="search-card container">
      <div className="search-card-inner">
        <div className="field">
          <SearchBar
            placeholder="Search watches"
            brandFilter={brandFilter}
            priceFilter={priceFilter}
            inputRef={searchInputRef}
            searchNowRef={searchNowRef}
          />
        </div>
        <div className="field select-field">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            aria-label="Brand filter"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
        <div className="field select-field">
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            aria-label="Price filter"
          >
            <option value="">Price Range</option>
            <option>Under $500</option>
            <option>$500 - $2,000</option>
            <option>$2,000 - $5,000</option>
            <option>$5,000+</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-outline search-btn"
        style={{ color: '#fff' }}
        onClick={handleSearchNow}
      >
        SEARCH NOW
      </button>
    </div>
  </section>
  {/* ============ CATEGORIES ============ */}
  <section className="categories" id="categories">
    <div className="container cat-inner">
      <div className="cat-copy">
        <p className="eyebrow">—</p>
        <h2>Shop By Category</h2>
        <p>Explore our wide range of premium watches across different styles and collections. Find the perfect watch that matches your personality.</p>
        <a href="#featured" className="btn btn-gold">View All</a>
      </div>
      <div className="cat-grid">
        <a href="#featured" className="cat-card">
          <i className="fa-solid fa-gem" />
          <span>Luxury<br />Watches</span>
        </a>
        <a href="#featured" className="cat-card">
          <i className="fa-regular fa-clock" />
          <span>Dress<br />Watches</span>
        </a>
        <a href="#featured" className="cat-card">
          <i className="fa-solid fa-tablet-screen-button" />
          <span>Smart<br />Watches</span>
        </a>
        <a href="#featured" className="cat-card">
          <i className="fa-solid fa-person-running" />
          <span>Sports<br />Watches</span>
        </a>
      </div>
    </div>
  </section>
  {/* ============ FEATURED WATCHES ============ */}
  <section className="featured" id="featured">
    <div className="container">
      <div className="section-title">
        <h2>Featured Watches</h2>
      </div>
      <div className="carousel-wrap">
        <button className="carousel-arrow left" id="prodPrev" aria-label="Previous product"><i className="fa-solid fa-chevron-left" /></button>
        <div className="product-grid" id="productGrid">
          {productsLoading && (
            <div style={{ padding: '24px', color: '#777' }}>Loading watches…</div>
          )}

          {!productsLoading && productsError && (
            <div style={{ padding: '24px', color: '#c0392b' }}>{productsError}</div>
          )}

          {!productsLoading && !productsError && products.length === 0 && (
            <div style={{ padding: '24px', color: '#777' }}>No watches found.</div>
          )}

          {!productsLoading && !productsError && products.map((product, index) => (
            <article className="product-card" key={product.id}>
              <span className="badge">{String(index + 1).padStart(2, '0')}</span>
              <div
                className="product-img"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/watch/${product.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/watch/${product.id}`);
                }}
              >
                <ProductImage image={product.image} alt={product.name} />
              </div>
              <h3
                className="product-title"
                onClick={() => navigate(`/watch/${product.id}`)}
              >
                {product.name}
              </h3>
              <p className="price">${Number(product.price || 0).toLocaleString()}</p>
              <div className="product-actions">
                <button
                  className="btn btn-outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  ADD TO CART
                </button>
                <button
                  className="btn btn-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyNow(product);
                  }}
                >
                  BUY NOW
                </button>
              </div>
            </article>
          ))}
        </div>
        <button className="carousel-arrow right" id="prodNext" aria-label="Next product"><i className="fa-solid fa-chevron-right" /></button>
      </div>
    </div>
  </section>
  {/* ============ ABOUT ============ */}
  <section className="about">
    <div className="about-copy">
      <p className="eyebrow">—</p>
      <h2>About <span>TimeKeepers</span></h2>
      <p>At TimeKeepers, we believe a watch is more than just a timepiece — it's a statement. We curate the finest collection of luxury, classic and modern watches to match every style and occasion.</p>
      <div className="about-actions">
        <a href="#contact" className="btn btn-dark">Get Started</a>
        <a href="#featured" className="btn btn-gold">Shop Now</a>
      </div>
    </div>
    <div className="about-media">
      <img src="https://images.unsplash.com/photo-1573261821759-fdd1b36d9ca5?auto=format&fit=crop&w=1200&q=80" alt="Close up of a gold and black chronograph watch" />
    </div>
  </section>
  {/* ============ MEMBERSHIP PLANS ============ */}
  <section className="plans" id="plans">
    <div className="container">
      <div className="section-title">
        <h2>Membership Plans</h2>
      </div>
      <div className="plans-grid">
        <div className="plan-card">
          <div className="plan-head">
            <span>Basic</span>
          </div>
          <p className="plan-price"><small>$</small>5<em>/month</em></p>
          <ul>
            <li><i className="fa-solid fa-check" /> Browse all watches</li>
            <li><i className="fa-solid fa-check" /> Wishlist</li>
            <li><i className="fa-solid fa-check" /> Exclusive offers</li>
          </ul>
          <button className="btn btn-outline">Join Now</button>
        </div>
        <div className="plan-card featured-plan">
          <div className="plan-head">
            <span>Standard</span>
          </div>
          <p className="plan-price"><small>$</small>15<em>/month</em></p>
          <ul>
            <li><i className="fa-solid fa-check" /> Everything in Basic</li>
            <li><i className="fa-solid fa-check" /> Priority support</li>
            <li><i className="fa-solid fa-check" /> Early access to sales</li>
          </ul>
          <button className="btn btn-dark">Join Now</button>
        </div>
        <div className="plan-card">
          <div className="plan-head">
            <span>Premium</span>
          </div>
          <p className="plan-price"><small>$</small>30<em>/month</em></p>
          <ul>
            <li><i className="fa-solid fa-check" /> Everything in Standard</li>
            <li><i className="fa-solid fa-check" /> VIP discounts</li>
            <li><i className="fa-solid fa-check" /> Free shipping</li>
            <li><i className="fa-solid fa-check" /> Premium support</li>
          </ul>
          <button className="btn btn-outline">Join Now</button>
        </div>
      </div>
    </div>
  </section>
  {/* ============ TESTIMONIALS ============ */}
  <section className="testimonials" id="testimonials">
    <div className="container">
      <div className="section-title">
        <h2>What Our Customers Say</h2>
      </div>
      <div className="testimonial-card">
        <i className="fa-solid fa-quote-left quote-icon" />
        <p id="testimonialText">Excellent quality watches and super fast delivery. My Seiko arrived perfectly packaged and looks even better in person. Will definitely shop here again!</p>
        <div className="testimonial-footer">
          <div className="testimonial-person">
            <img src="https://i.pravatar.cc/100?img=12" alt="Alexander R." id="testimonialAvatar" />
            <div>
              <h4 id="testimonialName">Alexander R.</h4>
              <span>Verified Buyer</span>
            </div>
          </div>
          <div className="testimonial-nav">
            <button id="testiPrev" aria-label="Previous testimonial"><i className="fa-solid fa-chevron-left" /></button>
            <button id="testiNext" aria-label="Next testimonial"><i className="fa-solid fa-chevron-right" /></button>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* ============ CONTACT ============ */}
  <section className="contact" id="contact">
    <div className="container">
      <div className="section-title">
        <h2>Contact TimeKeepers</h2>
      </div>
      <form className="contact-form" id="contactForm">
        <div className="contact-fields">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Email" required />
          <input type="text" placeholder="Message" required />
        </div>
        <div className="contact-actions">
          <button type="submit" className="btn btn-dark">Send</button>
          <a href="#" className="btn btn-gold">Map</a>
        </div>
      </form>
    </div>
  </section>
  {/* ============ FOOTER ============ */}
  <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand">
        <a href="#" className="logo">TIME <span>KEEPERS</span></a>
        <p>Enter your email</p>
        <form className="newsletter" id="newsletterForm">
          <input type="email" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
      </div>
      <div className="footer-col">
        <h5>Useful Links</h5>
        <a href="#">Home</a>
        <a href="#featured">Shop</a>
        <a href="#categories">Categories</a>
        <a href="#plans">Membership</a>
        <a href="#contact">Contact Us</a>
      </div>
      <div className="footer-col">
        <h5>Collections</h5>
        <a href="#featured">Luxury Watches</a>
        <a href="#featured">Dress Watches</a>
        <a href="#featured">Smart Watches</a>
        <a href="#featured">Sports Watches</a>
      </div>
      <div className="footer-col">
        <h5>Contact Us</h5>
        <a href="tel:+1234567890"><i className="fa-solid fa-phone" /> +1 234 567 890</a>
        <a href="mailto:support@timekeepers.com"><i className="fa-solid fa-envelope" /> support@timekeepers.com</a>
      </div>
      <div className="footer-col">
        <h5>Follow Us</h5>
        <p>Stay updated with our latest collections and offers.</p>
        <div className="socials">
          <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
          <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>
          <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
          <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© <span id="year" /> TimeKeepers. All Rights Reserved.</p>
    </div>
  </footer>
</div>

</>

  );
}

export default Home;
