import { useState } from 'react';
import './Header.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

/* NOTE: for all pages using this component, the search bar can be hidden if not 
needed for a page. To implement this, pass a boolean prop 'showSearch' to control 
visibility and set it to false for pages that don't need the search bar. For ex: in 
Analytics,jsx, I have:
  <Header
    siteName="Grammy Analytics"
    username="User"
    showSearch={false} <-- HERE
    onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
  />
*/

export default function Header({
  siteName = "CIS 5500",
  username = "",
  onLogout,
  onMenuToggle,
  onSearch = () => {},
  showSearch = true
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Song');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const options = ['Song', 'Artist'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 1) return;
    onSearch?.(trimmedQuery, searchType);
  };

  const userInitial = username ? username.charAt(0).toUpperCase() : 'U';
  const showUserSection = Boolean(username || onLogout);

  return (
    // also splitting header into 3 sections (left, center, right) to make styling easier.
    // appropriate changes have been made to Header.css for this
    <header className="header">
      <div className="header-left">
        {onMenuToggle ? (
          <button
            type="button"
            className="menu-toggle"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <span className="menu-toggle-line" />
            <span className="menu-toggle-line" />
            <span className="menu-toggle-line" />
          </button>
        ) : null}

        <div className="site-name">{siteName}</div>
      </div>

      <div className="header-center">
        {showSearch && (
          <form className="main-search-bar" onSubmit={handleSubmit}>
            <div className="search-bar-with-btn">
              <input
                className="main-search-bar-input"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <button
                className="search-btn"
                type="submit"
                title="Search"
              >
                <i className="fas fa-search"></i>
              </button>
            </div>

            <div className="custom-dropdown">
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setIsDropdownOpen((open) => !open)}
              >
                {searchType}
                <span className="dropdown-arrow">▼</span>
              </button>

              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {options.map((option) => (
                    <div
                      key={option}
                      className={`dropdown-item ${option === searchType ? 'active' : ''}`}
                      onClick={() => {
                        setSearchType(option);
                        setIsDropdownOpen(false);

                        const trimmedQuery = searchQuery.trim();
                        if (trimmedQuery.length >= 1) {
                          onSearch?.(trimmedQuery, option);
                        }
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="header-right">
        {showUserSection ? (
          <>
            <div id="user-pill">
              <div id="user-avatar">{userInitial}</div>
              <div id="user-display">{username || 'User'}</div>
            </div>

            {onLogout ? (
              <button
                type="button"
                className="logout-btn"
                onClick={onLogout}
              >
                Sign Out
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
