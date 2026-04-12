import { useState } from 'react';
import './Header.css'

export default function Header({
  siteName = "Site Name",
  username = "Username",
  searchPlaceholder = "Search...",
  onMenuToggle,
  onSearch = () => {},
  showSearch = true
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Song');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const options = ['Song', 'Artist', 'Album', 'Genre'];

  return (
    <header className="header">
      {/* left of header - menu icon and site name */}
      <div className="header-left">
        {onMenuToggle ? (
          <button
            type="button"
            className="menu-toggle"
            onClick={onMenuToggle}
          >
            {/* hamburger icon */}
            <span className="menu-toggle-line" />
            <span className="menu-toggle-line" />
            <span className="menu-toggle-line" />
          </button>
        ) : null}
        <div className="site-name">{siteName}</div>
      </div>

      {/* middle of header - search bar and filter */}
      {showSearch ? (
        <div className="main-search-bar">
          <input
            className="main-search-bar-input"
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="search-btn"
            onClick={() => onSearch(searchQuery, searchType)}
          >
            SEARCH
          </button>
          <div className="custom-dropdown">
            <button
              type="button"
              className="dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="header-spacer" />
      )}

      {/* right of header - user */}
      <div className="current-user">{username}</div>
    </header>
  );
}
