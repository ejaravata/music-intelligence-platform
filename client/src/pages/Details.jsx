import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
//import "../details.css";

export default function Details() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [searchType, setSearchType] = useState('Song');
  
  const handleSearch = (query, searchType) => {
    setCurrentPage(0);
    setCurrentQuery(query);
    setSearchType(searchType);
    const endpoint = searchType.toLowerCase() + 's';
    const offset = 0;
    const encodedQuery = encodeURIComponent(query);
    fetch(`http://${config.server_host}:${config.server_port}/overview`)
      .then(res => res.json())
      .then(resJson => {
        setQueryResults(resJson);
        setResultCount(resJson.length);
      })
      .catch(err => console.error('Search error:', err));
  };

  useEffect(() => {
    
  }, [queryResults, searchType])

  return (
    <main className="page">
      <Header
        siteName="Selected Details"
        username="User"
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
        showSearch={false}
        onSearch={handleSearch}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}>
          <SideMenu />
        </div>
      </div>
    </main>
  );
}