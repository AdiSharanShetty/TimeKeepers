function Search() {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>Simple Shop</h1>
      </div>
      
      {/* Navigation Links */}
      <div className="nav-links">
        <a href="/">Home</a>
        <a href="/cart">Cart (0)</a>
      </div>
    </nav>
  );
}

export default Search;