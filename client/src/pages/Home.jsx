import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';

const SPOTIFY_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/';

export default function Home() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [songImages, setSongImages] = useState({});

  const handleSearch = (query) => {
    fetch(`http://${config.server_host}:${config.server_port}/songs/search?q=${query}`)
      .then(res => res.json())
      .then(resJson => setQueryResults(resJson))
      .catch(err => console.error('Search error:', err));
  };

  const fetchSongImages = () => {
    queryResults.forEach((song) => {
      fetch(`${SPOTIFY_OEMBED_URL}${song.song_id}`)
        .then(res => res.json())
        .then(data => {
          setSongImages(prev => ({
            ...prev,
            [song.song_id]: data.thumbnail_url
          }));
        })
        .catch(err => console.error('Image fetch error:', err));
    });
  };

  useEffect(() => {
    fetchSongImages();
  }, [queryResults])

  return (
    <main className="page">
      <Header
        siteName="Home"
        username="User"
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
        onSearch={handleSearch}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}>
          <SideMenu />
        </div>

        <section className="page-content">
          <div className="home-grid">
            <ResultsColumn queryResults={queryResults} songImages={songImages} />
            <RecommendationsColumn />
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultsColumn({ queryResults, songImages }) {
  return (
    <div className="grid-column">
      <div className="column-header">
        <h2>Results</h2>
        <div className="nav-arrows">
          <button className="arrow-btn">‹</button>
          <button className="arrow-btn">›</button>
        </div>
      </div>

      <div className="songs-list">
        {queryResults.map((song) => (
          <SongCard
            key={song.song_id}
            song={song}
            thumbnail={songImages[song.song_id]}
          />
        ))}
      </div>
    </div>
  );
}

function SongCard({ song, thumbnail }) {
  return (
    <div className="song-card">
      {thumbnail && (
        <img
          src={thumbnail}
          alt={song.song_name}
          className="song-thumbnail"
        />
      )}
      <div className="song-info">
        <p className="song-id">{song.song_id}</p>
        <p className="song-name">{song.song_name}</p>
      </div>
    </div>
  );
}

function RecommendationsColumn() {
  return (
    <div className="grid-column">
      <div className="column-header">
        <h2>For You</h2>
        <div className="nav-arrows">
          <button className="arrow-btn">‹</button>
          <button className="arrow-btn">›</button>
        </div>
      </div>
      {/* TODO: add recommendations */}
    </div>
  );
}
