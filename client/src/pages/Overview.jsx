import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
import "../overview.css";

export default function Overview() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [searchType, setSearchType] = useState('Song');

  // OPTIONAL state to track loading
  const [loading, setLoading] = useState(false);

  // ================================
  // EXISTING SEARCH FUNCTION (UNCHANGED)
  // ================================
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

  // ================================
  // FETCH TRENDING SONGS
  // ================================
  const fetchTrendingSongs = () => {
    setLoading(true);

    fetch(`http://${config.server_host}:${config.server_port}/billboard/trending_songs`)
      .then(res => res.json())
      .then(data => {
        // Store results in existing state
        setQueryResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching trending songs:", err);
        setLoading(false);
      });
  };

  // ================================
  // RUN ON PAGE LOAD
  // ================================
  useEffect(() => {
  let hasFetched = false;

  if (!hasFetched) {
    fetchTrendingSongs();
    hasFetched = true;
  }
}, []);

  return (
    <main className="page">
      <Header
        siteName="Overview"
        username="User"
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
        onSearch={handleSearch}
        showSearch={false}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}>
          <SideMenu />
        </div>

        {/* ================================
            NEW: MAIN CONTENT AREA
        ================================= */}
        <div className="overview-content">

          <h2>Trending Songs</h2>

          {/* Loading indicator */}
          {loading && <p>Loading trending songs...</p>}

          {/* Scrollable table container */}
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
                    {/* Match your SQL output structure */}
                    <td>{row.current_rank}</td>
                    <td>{row.song_name}</td>
                    <td>{row.string_agg}</td>
                    <td>{row.week_ending_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </main>
  );
}