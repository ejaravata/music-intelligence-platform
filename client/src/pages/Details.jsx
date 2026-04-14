import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
//import "../details.css";

export default function Details() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [searchType, setSearchType] = useState('Song');
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`http://${config.server_host}:${config.server_port}/me`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const user = await res.json();
        const fullName =
          user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.name || user.email || "User";

        setUserName(fullName);
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    }

    loadUser();
  }, []);

  async function logout() {
    try {
      await fetch(`http://${config.server_host}:${config.server_port}/logout`, {
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }

    navigate("/", { replace: true });
  }
  
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
        username={userName}
        onLogout={logout}
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
