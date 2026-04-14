import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
import "../overview.css";

export default function Overview() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [searchType, setSearchType] = useState('Song');

  //stats state
  const [songCount, setSongCount] = useState(0);
  const [artistCount, setArtistCount] = useState(0);
  const [albumCount, setAlbumCount] = useState(0);

  const [loading, setLoading] = useState(false);
  
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  // ================================
  // SEARCH FUNCTION (cleaned)
  // ================================
  const handleSearch = (query, searchType) => {
    setSearchType(searchType);

    fetch(`http://${config.server_host}:${config.server_port}/overview`)
      .then(res => res.json())
      .then(resJson => {
        setQueryResults(resJson);
      })
      .catch(err => console.error('Search error:', err));
  };

  // ================================
  // FETCH TRENDING SONGS
  // ================================
  const fetchTrendingSongs = () => {
    setLoading(true);

    fetch(`http://${config.server_host}:${config.server_port}/billboard/trending_songs`)
      .then(res => res.json())
      .then(data => {
        setQueryResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching trending songs:", err);
        setLoading(false);
      });
  };

  // ================================
  // FETCH STATS
  // ================================
  const fetchStats = () => {
    fetch(`http://${config.server_host}:${config.server_port}/stats/song_count`)
      .then(res => res.json())
      .then(data => setSongCount(data.song_count));

    fetch(`http://${config.server_host}:${config.server_port}/stats/artist_count`)
      .then(res => res.json())
      .then(data => setArtistCount(data.artist_count));

    fetch(`http://${config.server_host}:${config.server_port}/stats/album_count`)
      .then(res => res.json())
      .then(data => setAlbumCount(data.album_count));
  };

  // ================================
  // RUN ON PAGE LOAD
  // ================================
  useEffect(() => {
    fetchTrendingSongs();
    fetchStats();
  }, []);

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
    fetchTrendingSongs();
    fetchStats();
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

  return (
    <main className="page">
      <Header
        siteName="Overview"
        username={userName}
        onLogout={logout}
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
        onSearch={handleSearch}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}>
          <SideMenu />
        </div>

        {/* MAIN CONTENT */}
        <div className="overview-content">
          <h2>Billboard Trending Songs</h2>

          {loading && <p>Loading trending songs...</p>}

          <div className="overview-main">

            {/* TABLE */}
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Song</th>
                    <th>Artist(s)</th>
                    <th>Week</th>
                  </tr>
                </thead>

                <tbody>
                  {queryResults.map((row, index) => (
                    <tr key={index}>
                      <td>{row.current_rank}</td>
                      <td>{row.song_name}</td>
                      <td>{row.string_agg}</td>
                      <td>{row.week_ending_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* STATS PANEL */}
            <div className="stats-panel">
              <div className="stat-card">
                <h3>Number of Songs in Data</h3>
                <p>{songCount}</p>
              </div>

              <div className="stat-card">
                <h3>Number of Artists in Data</h3>
                <p>{artistCount}</p>
              </div>

              {/* <div className="stat-card">
                <h3>Unique Album Count</h3>
                <p>{albumCount}</p>
              </div> */}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
