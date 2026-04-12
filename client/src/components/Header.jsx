import { useState } from 'react';
import './Header.css'
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Header({
  siteName = "CIS 5500",
  username = "Username",
  onMenuToggle,
  onSearch = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Song');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const options = ['Song', 'Artist', 'Album', 'Genre'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 1) return;
    onSearch(trimmedQuery, searchType);
  };

  return (
    <header className="header">
      <div className="header-left">
        {onMenuToggle ? (
          <button
            type="button"
            className="menu-toggle"
            onClick={onMenuToggle}
          >
            <span className="menu-toggle-line" />
            <span className="menu-toggle-line" />
            <span className="menu-toggle-line" />
          </button>
        ) : null}
        <div className="site-name">{siteName}</div>
      </div>

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
                    const trimmedQuery = searchQuery.trim();
                    if (trimmedQuery.length >= 1) {
                      onSearch(trimmedQuery, option);
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
      <div className="current-user">{username}</div>
    </header>
  );
}
