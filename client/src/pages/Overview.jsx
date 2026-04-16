import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
import "../overview.css";

export default function Overview({ onLogout }) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [searchType, setSearchType] = useState('Song');

  //billboard trending states
  const [page, setPage] = useState(0);

  //stats state
  const [songCount, setSongCount] = useState(0);
  const [artistCount, setArtistCount] = useState(0);
  const [albumCount, setAlbumCount] = useState(0);

  //audio attributes state - default count by genre
  const [attribute, setAttribute] = useState("genre");
  const [audioData, setAudioData] = useState([]);

  //top songs states
  const [topSongs, setTopSongs] = useState([]);
  const [topPage, setTopPage] = useState(0);

  //years and awards
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [awardResults, setAwardResults] = useState([]);
  const [awardPage, setAwardPage] = useState(0);

  const [loading, setLoading] = useState(false);
  //user login stuff
  const [userName, setUserName] = useState("User");
  //need this for navigating to other pages

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
  // const fetchTrendingSongs = () => {
  //   setLoading(true);

  //   fetch(`http://${config.server_host}:${config.server_port}/billboard/trending_songs`)
  //     .then(res => res.json())
  //     .then(data => {
  //       setQueryResults(data);
  //       setLoading(false);
  //     })
  //     .catch(err => {
  //       console.error("Error fetching trending songs:", err);
  //       setLoading(false);
  //     });
  // };

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
  // FETCH YEARS AND AWARDS
  // ================================

  const fetchYears = () => {
  fetch(`http://${config.server_host}:${config.server_port}/awards/years`)
    .then(res => res.json())
    .then(data => {
      setYears(data);
      if (data.length > 0) {
        setSelectedYear(data[0].year);
      }
    });
};

const fetchAwardWinners = (year, page = 0) => {
  fetch(`http://${config.server_host}:${config.server_port}/awards/winners?year=${year}&page=${page}`)
    .then(res => res.json())
    .then(data => setAwardResults(data));
};

  // ================================
  // FETCH TOP SONGS BY SONG POPULARITY
  // ================================
const fetchTopSongs = (page = 0) => {
  fetch(`http://${config.server_host}:${config.server_port}/songs/top_popular?page=${page}`)
    .then(res => res.json())
    .then(data => setTopSongs(data));
};
// ================================
  // FETCH Audio Distribution
  // ================================

const fetchAudioDistribution = (attr) => {
  fetch(`http://${config.server_host}:${config.server_port}/audio/distribution?attribute=${attr}`)
    .then(res => res.json())
    .then(data => setAudioData(data));
};

  // ================================
  // RUN ON PAGE LOAD
  // ================================

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
    //fetchTrendingSongs();
    fetchStats();
    fetchYears();
    fetchAudioDistribution("genre");
  }, []);

  //commented this out, too many unecessary useEffects
  // useEffect(() => {
  //   fetchTrendingSongs();
  //   fetchStats();
  //   fetchYears();
  //   fetchAudioDistribution("genre");
  // }, []);

  useEffect(() => {
    fetchAudioDistribution(attribute);
  }, [attribute]);

  useEffect(() => {
    if (selectedYear) {
        fetchAwardWinners(selectedYear, awardPage);
      }
    }, [selectedYear, awardPage]);

  useEffect(() => {
    fetchTopSongs(topPage);
  }, [topPage]);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://${config.server_host}:${config.server_port}/billboard/trending_songs?page=${page}`);
        const data = await res.json();
        setQueryResults(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchSongs();
  }, [page]);
  
  //do not remove, used for audio attributes chart
    const maxCount = audioData.length > 0 ? Math.max(...audioData.map(d => d.count)) : 1;
  return (
    <main className="page">
      <Header
        siteName="Overview"
        username={userName}
        showSearch={false}
        onLogout={onLogout}
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
        onSearch={handleSearch}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}>
          <SideMenu />
        </div>

        {/* BILLBOARD RANKING */}
                <div className="overview-content">
                  <h2>Billboard Trending Songs</h2>
                  <p classname=".audio-card-note">
                    Retrieves the most recent Billboard chart entries as of 2025 along with their current ranking.
                  </p>

                  {loading && <p>Loading trending songs...</p>}

                  <div className="overview-main">

                    {/* TABLE */}
                    <div className="song-list">
                      {queryResults.map((row, index) => (
                        <div className="song-card" key={index}>

                          {/* Rank */}
                          <div className="song-rank">
                            #{row.current_rank}
                          </div>

                          {/* Info */}
                          <div className="song-info">
                            {/* Makes songs navigated to their own page, geez this was complicated*/}
                            {/* <div className="song-title">{row.song_name}</div> */}
                            <div
                                  className="song-title"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate(`/song/${row.song_id}`)}
                                >
                                  {row.song_name}
                                </div>
                            <div className="song-artist">{row.string_agg}</div>
                          </div>

                        </div>
                      ))}
                    </div>

                    {/* PAGINATION */}
                    <div className="pagination">
                      <button 
                        onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                        disabled={page === 0}
                      >
                        Prev
                      </button>

                      <span>Page {page + 1}</span>

                      <button 
                        onClick={() => setPage(page + 1)}
                        disabled={queryResults.length < 5}
                      >
                        Next
                      </button>
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
            </div>

            {/*  */}
            {/* ================================
                        TOP POPULAR SONGS
                    ================================ */}
                    <div className="top-songs-section">

                      <h2>Top Songs by Popularity</h2>
                      <p classname=".audio-card-note">
                        Top 15 songs in the Spotify dataset based on popularity score.
                      </p>

                      <div className="top-songs-container">

                        {topSongs.map((row, index) => (
                          <div className="top-song-card" key={index}>

                            {/* Song Info */}
                            <div className="top-song-info">
                              <div
                                  className="top-song-title"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigate(`/song/${row.song_id}`)}
                                >
                                  {row.song_name}
                                </div>
                              <div className="top-song-meta">
                                {row.artist_name} • {row.album_name}
                              </div>
                              <div className="top-song-genre">{row.genre}</div>
                            </div>

                            {/* Popularity Bar */}
                            <div className="popularity-bar-wrapper">
                              <div
                                className="popularity-bar"
                                style={{
                                  width: `${row.popularity}%`
                                }}
                              ></div>
                            </div>

                            {/* Value */}
                            <div className="popularity-value">
                              {row.popularity}
                            </div>

                          </div>
                        ))}

                      </div>

                      {/* Pagination */}
                      <div className="pagination">
                        <button
                          onClick={() => setTopPage(prev => Math.max(prev - 1, 0))}
                          disabled={topPage === 0}
                        >
                          Prev
                        </button>

                        <span>Page {topPage + 1}</span>

                        <button
                          onClick={() => setTopPage(prev => Math.min(prev + 1, 2))}
                          disabled={topPage === 2}
                        >
                          Next
                        </button>
                      </div>

                    </div>
            {/*  */}

            {/* ================================
                  AWARDS SECTION
              ================================ */}
              <div className="awards-section">

                <h2>Grammy Award Winning Songs</h2>

                <p classname=".audio-card-note">
                   Grammy Awards based on year. Select a year to look through the different winners and their awards.
                </p>

                {/* Year Dropdown */}
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setAwardPage(0);
                  }}
                >
                  {years.map((y, index) => (
                    <option key={index} value={y.year}>
                      {y.year}
                    </option>
                  ))}
                </select>

                {/* Results Table */}
                <div className="awards-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Song</th>
                        <th>Artist</th>
                        <th>Award</th>
                      </tr>
                    </thead>

                    <tbody>
                      {awardResults.map((row, index) => (
                        <tr key={index}>
                          <td>{row.song_title}</td>
                          <td>{row.artist_name}</td>
                          <td>{row.award}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <button
                    onClick={() => setAwardPage(prev => Math.max(prev - 1, 0))}
                    disabled={awardPage === 0}
                  >
                    Prev
                  </button>

                  <span>Page {awardPage + 1}</span>

                  <button
                    onClick={() => setAwardPage(prev => prev + 1)}
                  >
                    Next
                  </button>
                </div>

              </div>

              {/* ================================
                      AUDIO ATTRIBUTE VISUALIZATION
                  ================================ */}
                  <div className="audio-section">

                    <h2>Audio Attribute Distribution</h2>

                    <p classname=".audio-card-note">
                      Note: This chart shows the frequency of each attribute in our dataset
                    </p>

                    {/* Dropdown */}
                    <select
                      value={attribute}
                      onChange={(e) => setAttribute(e.target.value)}
                    >
                      <option value="genre">Genre</option>
                      <option value="key">Key</option>
                      <option value="duration">Duration</option>
                      <option value="energy">Energy</option>
                    </select>
                    
              
                    {/* Bar Chart */}
                    <div className="bar-chart">
                    {audioData.map((item, index) => (
                      <div className="bar-item" key={`${attribute}-${index}`}>

                        {/* VALUE LABEL */}
                        <span className="bar-value">{item.count}</span>

                        <div
                          className="bar"
                          style={{
                            height: `${Math.max((item.count / maxCount) * 250, 5)}px`,
                            animation: `growBar 0.5s ease ${index * 0.05}s backwards`
                          }}
                        ></div>

                        <span className="bar-label">{item.label}</span>

                    </div>
                  ))}
                </div>

              </div>
              {/* Add more divs after this one */}
                  

          </div>
        </div>
      </div>
    </main>
  );
}
