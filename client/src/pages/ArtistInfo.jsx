import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';

const SPOTIFY_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/';
const ARTIST_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/artist/';

export default function ArtistInfo() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [artistImage, setArtistImage] = useState(null);
  const [artistName, setArtistName] = useState('');
  const [songs, setSongs] = useState([]);
  const [songImages, setSongImages] = useState({});
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [relatedArtistImages, setRelatedArtistImages] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const resultsPerPage = 5;
  
  useEffect(() => {
    if (artistId) {
      fetch(`http://${config.server_host}:${config.server_port}/artist/${artistId}`)
        .then(res => res.json())
        .then(data => {
          setArtistName(data.artist_name);
          setArtistImage(data.artist_image || null);
        })
        .catch(err => console.error('Artist info fetch error:', err));
    }
  }, [artistId]);

  useEffect(() => {
    if (artistId) {
      const offset = currentPage * resultsPerPage;
      fetch(`http://${config.server_host}:${config.server_port}/artist_songs?id=${artistId}&limit=${resultsPerPage}&offset=${offset}`)
        .then(res => res.json())
        .then(data => {
          setSongs(data);
          setResultCount(data.length);
        })
        .catch(err => console.error('Artist songs fetch error:', err));
    }
  }, [artistId, currentPage, resultsPerPage]);

  const fetchSongImages = () => {
    songs.forEach((song) => {
      fetch(`${SPOTIFY_OEMBED_URL}${song.song_id}`)
        .then(res => res.json())
        .then(data => {
          setSongImages(prev => ({
            ...prev,
            [song.song_id]: data.thumbnail_url
          }));
        })
        .catch(err => console.error('Song image fetch error:', err));
    });
  };

  useEffect(() => {
    if (songs.length > 0) {
      fetchSongImages();
    }
  }, [songs]);

  useEffect(() => {
    if (artistId) {
      fetch(`${ARTIST_OEMBED_URL}${artistId}`)
        .then(res => res.json())
        .then(data => {
          setArtistImage(data.thumbnail_url);
        })
        .catch(err => console.error('Artist image fetch error:', err));
    }
  }, [artistId]);

  useEffect(() => {
    if (artistId) {
      fetch(`http://${config.server_host}:${config.server_port}/related?id=${artistId}&type=artist`)
        .then(res => res.json())
        .then(data => {
          setRelatedArtists(data);
        })
        .catch(err => console.error('Related artists fetch error:', err));
    }
  }, [artistId]);

  const fetchRelatedArtistImages = () => {
    relatedArtists.forEach((artist) => {
      fetch(`${ARTIST_OEMBED_URL}${artist.artist_id}`)
        .then(res => res.json())
        .then(data => {
          setRelatedArtistImages(prev => ({
            ...prev,
            [artist.artist_id]: data.thumbnail_url
          }));
        })
        .catch(err => console.error('Related artist image fetch error:', err));
    });
  };

  useEffect(() => {
    if (relatedArtists.length > 0) {
      fetchRelatedArtistImages();
    }
  }, [relatedArtists]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (resultCount === resultsPerPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const hasMoreResults = resultCount === resultsPerPage;

  const handleSongClick = (songId) => {
    navigate(`/song/${songId}`);
  };

  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`);
  };

  return (
    <main className="page">
      <Header
        siteName="Artist Info"
        username="User"
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}>
          <SideMenu />
        </div>

        <section className="page-content">
          <div className="info-container">
            <div className="info-header">
              <div className="info-thumbnail artist-thumbnail placeholder-icon">
                {artistImage ? (
                  <img src={artistImage} alt="Artist" className="thumbnail-img" />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>
              <div className="info-details-text">
                <h1 className="info-title">{artistName}</h1>
              </div>
            </div>

            <div className="home-grid">
              <div className="grid-column">
                <div className="column-header">
                  <h2>Songs by this Artist</h2>
                  <div className="nav-arrows">
                    <button
                      className="arrow-btn"
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                    >
                      ‹
                    </button>
                    <button
                      className="arrow-btn"
                      onClick={handleNextPage}
                      disabled={!hasMoreResults}
                    >
                      ›
                    </button>
                  </div>
                </div>
                <div className="songs-list">
                  {songs.map((song) => (
                    <SongCard
                      key={song.song_id}
                      song={song}
                      thumbnail={songImages[song.song_id]}
                      onClick={() => handleSongClick(song.song_id)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid-column">
                <div className="column-header">
                  <h2>Related Artists</h2>
                </div>
                <div className="artists-list">
                  {relatedArtists.map((artist) => (
                    <div
                      key={artist.artist_id}
                      className="artist-card"
                      onClick={() => handleArtistClick(artist.artist_id)}
                    >
                      <div className="artist-thumbnail placeholder-icon">
                        {relatedArtistImages[artist.artist_id] ? (
                          <img src={relatedArtistImages[artist.artist_id]} alt={artist.artist_name} className="thumbnail-img" />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="artist-info">
                        <p className="artist-name">{artist.artist_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
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
