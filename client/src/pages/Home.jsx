import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
import '@fortawesome/fontawesome-free/css/all.css';

const SPOTIFY_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/';
const ARTIST_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/artist/';

export default function Home() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [songImages, setSongImages] = useState({});
  const [artistImages, setArtistImages] = useState({});
  const [searchType, setSearchType] = useState('Song');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const [resultCount, setResultCount] = useState(0);
  const resultsPerPage = 10;

  const handleSearch = (query, searchType) => {
    setCurrentPage(0);
    setCurrentQuery(query);
    setSearchType(searchType);
    const type = searchType.toLowerCase() + 's';
    const offset = 0;
    const encodedQuery = encodeURIComponent(query);
    fetch(`http://${config.server_host}:${config.server_port}/search?q=${encodedQuery}&type=${type}&limit=${resultsPerPage}&offset=${offset}`)
      .then(res => res.json())
      .then(resJson => {
        setQueryResults(resJson);
        setResultCount(resJson.length);
      })
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

  const fetchArtistImages = () => {
    queryResults.forEach((artist) => {
      fetch(`${ARTIST_OEMBED_URL}${artist.artist_id}`)
        .then(res => res.json())
        .then(data => {
          setArtistImages(prev => ({
            ...prev,
            [artist.artist_id]: data.thumbnail_url
          }));
        })
        .catch(err => console.error('Artist image fetch error:', err));
    });
  };

  useEffect(() => {
    if (searchType === 'Artist') {
      fetchArtistImages();
    } else {
      fetchSongImages();
    }
  }, [queryResults, searchType])

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      const type = searchType.toLowerCase() + 's';
      const offset = newPage * resultsPerPage;
      fetch(`http://${config.server_host}:${config.server_port}/search?q=${encodeURIComponent(currentQuery)}&type=${type}&limit=${resultsPerPage}&offset=${offset}`)
        .then(res => res.json())
        .then(resJson => {
          setQueryResults(resJson);
          setResultCount(resJson.length);
        })
        .catch(err => console.error('Search error:', err));
    }
  };

  const handleNextPage = () => {
    if (resultCount === resultsPerPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      const type = searchType.toLowerCase() + 's';
      const offset = newPage * resultsPerPage;
      fetch(`http://${config.server_host}:${config.server_port}/search?q=${encodeURIComponent(currentQuery)}&type=${type}&limit=${resultsPerPage}&offset=${offset}`)
        .then(res => res.json())
        .then(resJson => {
          setQueryResults(resJson);
          setResultCount(resJson.length);
        })
        .catch(err => console.error('Search error:', err));
    }
  };

  const hasMoreResults = resultCount === resultsPerPage;

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
            <ResultsColumn 
              queryResults={queryResults} 
              songImages={songImages} 
              artistImages={artistImages} 
              searchType={searchType}
              currentPage={currentPage}
              hasMoreResults={hasMoreResults}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
            <RecommendationsColumn />
          </div>
        </section>
      </div>
    </main>
  );
}

function ResultsColumn({ 
  queryResults, 
  songImages, 
  artistImages, 
  searchType, 
  currentPage, 
  hasMoreResults, 
  onPrevPage, 
  onNextPage 
}) {
  const navigate = useNavigate();

  return (
    <div className="grid-column">
      <div className="column-header">
        <h2>Results</h2>
        <div className="nav-arrows">
          <button
            className="arrow-btn"
            onClick={onPrevPage}
            disabled={currentPage === 0}
          >
            ‹
          </button>
          <button
            className="arrow-btn"
            onClick={onNextPage}
            disabled={!hasMoreResults}
          >
            ›
          </button>
        </div>
      </div>

      <div className="songs-list">
        {queryResults.map((result) =>
          searchType === 'Artist' ? (
            <ArtistCard
              key={result.artist_id}
              artist={result}
              image={artistImages[result.artist_id]}
            />
          ) : (
            <SongCard
              key={result.song_id}
              song={result}
              thumbnail={songImages[result.song_id]}
              onClick={() => navigate(`/song/${result.song_id}`)}
            />
          )
        )}
      </div>
    </div>
  );
}

function SongCard({ song, thumbnail, onClick }) {
  const navigate = useNavigate();
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const handleArtistClick = (e, artistId) => {
    e.stopPropagation();
    navigate(`/artist/${artistId}`);
  };

  return (
    <div className="song-card" onClick={onClick}>
      {thumbnail && (
        <img
          src={thumbnail}
          alt={song.song_name}
          className="song-thumbnail"
          onError={handleImageError}
        />
      )}
      {!thumbnail && (
        <div className="song-thumbnail placeholder-icon">
          <i className="fas fa-music"></i>
        </div>
      )}
      <div className="song-info">
        <p className="song-name">{song.song_name}</p>
        <p className="artists">
          {Array.isArray(song.artists) ?
            song.artists.map((artist, index) => (
              <span key={artist.artist_id}>
                <span
                  className="artist-link"
                  onClick={(e) => handleArtistClick(e, artist.artist_id)}
                >
                  {artist.artist_name}
                </span>
                {index < song.artists.length - 1 && <span>, </span>}
              </span>
            )) :
            song.artists
          }
        </p>
      </div>
    </div>
  );
}

function ArtistCard({ artist, image }) {
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className="artist-card">
      {image && (
        <img
          src={image}
          alt={artist.artist_name}
          className="artist-thumbnail"
          onError={handleImageError}
        />
      )}
      {!image && (
        <div className="artist-thumbnail placeholder-icon">
          <i className="fas fa-user"></i>
        </div>
      )}
      <div className="artist-info">
        <p className="artist-name">{artist.artist_name}</p>
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
