import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImage from './ProductImage';
import useProducts from '../utils/useProducts';

// ---------------------------------------------------------------------------
// SearchBar
//
// Live search over the SHARED product list (useProducts) — the same module-level
// cache the Home grid and the WatchDetails page use, so the dropdown makes no
// extra request. Behaviour (Section 4 of the brief):
//   * typing filters name and brand case-insensitively, live
//   * the Brand and Price Range selects (props from Home) filter results too
//   * rows show a thumbnail, name, brand and price; a row opens /watch/:id
//   * "No watches found" when nothing matches
//   * keyboard: arrows move the highlight, Enter opens, Esc closes
//   * clicking outside the bar or navigating closes the dropdown
//   * searchNowRef.current() is wired to Home's SEARCH NOW button: it opens the
//     highlighted row, or the top match when nothing is highlighted
// ---------------------------------------------------------------------------

// Price Range select values. The options in Home.js have no value attribute,
// so their text doubles as the value — keep these keys in sync with the labels.
const PRICE_TESTS = {
  'Under $500': (price) => price < 500,
  '$500 - $2,000': (price) => price >= 500 && price < 2000,
  '$2,000 - $5,000': (price) => price >= 2000 && price < 5000,
  '$5,000+': (price) => price >= 5000,
};

function formatPrice(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString()}`;
}

function SearchBar({
  placeholder = 'Search watches',
  autoFocus = false,
  brandFilter = '',
  priceFilter = '',
  inputRef = null,
  searchNowRef = null,
}) {
  const navigate = useNavigate();
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef(null);

  // Close the dropdown when clicking outside the component.
  useEffect(() => {
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Changing a select re-opens the dropdown so the new results are visible.
  useEffect(() => {
    setOpen(true);
  }, [brandFilter, priceFilter]);

  // Name/brand text match (case-insensitive), narrowed by the brand and price
  // selects. With no text typed the filters alone still produce a list, which
  // is what SEARCH NOW opens.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const priceTest = PRICE_TESTS[priceFilter];
    return products.filter((product) => {
      if (q) {
        const name = (product.name || '').toLowerCase();
        const brand = (product.brand || '').toLowerCase();
        if (!name.includes(q) && !brand.includes(q)) return false;
      }
      if (brandFilter && (product.brand || '') !== brandFilter) return false;
      if (priceTest && !priceTest(Number(product.price) || 0)) return false;
      return true;
    });
  }, [products, query, brandFilter, priceFilter]);

  // A new result list invalidates the old highlight.
  useEffect(() => {
    setActiveIndex(-1);
  }, [matches]);

  const hasCriteria = query.trim().length > 0 || Boolean(brandFilter) || Boolean(priceFilter);
  const showDropdown = open && hasCriteria;

  const goToProduct = useCallback(
    (product) => {
      if (!product) return;
      setOpen(false);
      navigate(`/watch/${product.id}`);
    },
    [navigate]
  );

  // Home's SEARCH NOW button calls this: open the highlighted row, or the top
  // match when nothing is highlighted. With no results, show the empty state.
  useEffect(() => {
    if (!searchNowRef) return undefined;
    searchNowRef.current = () => {
      const target = matches[activeIndex >= 0 ? activeIndex : 0];
      if (target) goToProduct(target);
      else setOpen(true);
    };
    return () => {
      searchNowRef.current = null;
    };
  }, [searchNowRef, matches, activeIndex, goToProduct]);

  const handleFocus = () => setOpen(true);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(matches.length - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? matches[activeIndex] : matches[0];
      if (target) goToProduct(target);
    }
  };

  let statusText = null;
  if (error) statusText = error;
  else if (loading) statusText = 'Searching…';
  else if (matches.length === 0) statusText = 'No watches found';

  return (
    <div className="search-bar" ref={rootRef} style={{ position: 'relative' }}>
      <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search watches"
          autoComplete="off"
          autoFocus={autoFocus}
          style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
        />
      </div>

      {showDropdown && (
        <div
          className="search-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e3e3e3',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            maxHeight: 380,
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {statusText && (
            <div style={{ padding: '14px 16px', color: '#777', fontSize: 14 }}>
              {statusText}
            </div>
          )}

          {matches.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {matches.map((product, idx) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => goToProduct(product)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    role="option"
                    aria-selected={idx === activeIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      border: 'none',
                      background: idx === activeIndex ? '#f6f1e0' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <ProductImage
                      image={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontWeight: 600,
                          color: '#222',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.name}
                      </span>
                      {product.brand && (
                        <span style={{ display: 'block', fontSize: 12, color: '#888' }}>
                          {product.brand}
                        </span>
                      )}
                    </span>
                    <span style={{ fontWeight: 700, color: '#a67c00' }}>
                      {formatPrice(product.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;

