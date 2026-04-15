import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';
import '../home.css';
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
  const [userName, setUserName] = useState('User');
  const [selectedSong, setSelectedSong] = useState(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [userId, setUserId] = useState(null);

  const [likedSongs, setLikedSongs] = useState(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState(new Set());

  const [recentFavorites, setRecentFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recImages, setRecImages] = useState({});
  const [recentFavoriteImages, setRecentFavoriteImages] = useState({});
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const navigate = useNavigate();
  const resultsPerPage = 10;
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadInitialData();
    loadFavorites();
  }, []);

  async function loadInitialData() {
    try {
      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/me`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) return;

      const user = await res.json();
      const fullName =
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.name || user.email || 'User';

      setUserName(fullName);
      setUserId(user.id);

      await loadForYou(user.id);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  }

  async function loadForYou(currUserId) {
    if (!currUserId) return;

    try {
      setRecommendationsLoading(true);

      const [favoritesRes, recsRes] = await Promise.all([
        fetch(
          `http://${config.server_host}:${config.server_port}/user/favorite_songs/${currUserId}?limit=3`,
          { credentials: 'include' }
        ),
        fetch(
          `http://${config.server_host}:${config.server_port}/user/${currUserId}/recommendations/audio_attributes`,
          { credentials: 'include' }
        ),
      ]);

      const favoritesJson = favoritesRes.ok ? await favoritesRes.json() : [];
      const recsJson = recsRes.ok ? await recsRes.json() : [];

      setRecentFavorites(Array.isArray(favoritesJson) ? favoritesJson : []);
      setRecommendations(Array.isArray(recsJson) ? recsJson : []);
    } catch (err) {
      console.error('Failed to load For You data:', err);
      setRecentFavorites([]);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }

  async function loadFavorites() {
    try {
      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/favorites`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) return;

      const favorites = await res.json();
      setLikedSongs(
        new Set((favorites || []).map((fav) => String(fav.spotify_id)))
      );
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }

  useEffect(() => {
    const handlePageClick = () => {
      setSelectedSong(null);
      setIsPlayerVisible(false);
    };

    if (selectedSong && isPlayerVisible) {
      document.addEventListener('click', handlePageClick);
    }

    return () => {
      document.removeEventListener('click', handlePageClick);
    };
  }, [selectedSong, isPlayerVisible]);

  async function logout() {
    try {
      await fetch(`http://${config.server_host}:${config.server_port}/logout`, {
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout failed', err);
    }

    navigate('/', { replace: true });
  }

  const handleSearch = (query, typeLabel) => {
    setCurrentPage(0);
    setCurrentQuery(query);
    setSearchType(typeLabel);
    setQueryResults([]);
    setSearchLoading(true);

    const type = typeLabel.toLowerCase() + 's';
    const offset = 0;
    const encodedQuery = encodeURIComponent(query);

    fetch(
      `http://${config.server_host}:${config.server_port}/search?q=${encodedQuery}&type=${type}&limit=${resultsPerPage}&offset=${offset}`
    )
      .then((res) => res.json())
      .then((resJson) => {
        setQueryResults(resJson);
        setResultCount(resJson.length);
      })
      .catch((err) => console.error('Search error:', err))
      .finally(() => setSearchLoading(false));
  };

  const fetchSongImages = () => {
    queryResults.forEach((song) => {
      if (!song?.song_id || songImages[song.song_id]) return;

      fetch(`${SPOTIFY_OEMBED_URL}${song.song_id}`)
        .then((res) => res.json())
        .then((data) => {
          setSongImages((prev) => ({
            ...prev,
            [song.song_id]: data.thumbnail_url,
          }));
        })
        .catch((err) => console.error('Image fetch error:', err));
    });
  };

  const fetchArtistImages = () => {
    queryResults.forEach((artist) => {
      if (!artist?.artist_id || artistImages[artist.artist_id]) return;

      fetch(`${ARTIST_OEMBED_URL}${artist.artist_id}`)
        .then((res) => res.json())
        .then((data) => {
          setArtistImages((prev) => ({
            ...prev,
            [artist.artist_id]: data.thumbnail_url,
          }));
        })
        .catch((err) => console.error('Artist image fetch error:', err));
    });
  };

  const fetchForYouImages = async (songs, setter) => {
    for (const song of songs) {
      if (!song?.song_id) continue;

      setter((prev) => {
        if (prev[song.song_id]) return prev;
        return prev;
      });

      try {
        const res = await fetch(`${SPOTIFY_OEMBED_URL}${song.song_id}`);
        const data = await res.json();

        setter((prev) => ({
          ...prev,
          [song.song_id]: data.thumbnail_url,
        }));
      } catch (err) {
        console.error('For You image fetch error:', err);
      }
    }
  };

  useEffect(() => {
    if (recentFavorites.length > 0) {
      fetchForYouImages(recentFavorites, setRecentFavoriteImages);
    }
  }, [recentFavorites]);

  useEffect(() => {
    if (recommendations.length > 0) {
      fetchForYouImages(recommendations, setRecImages);
    }
  }, [recommendations]);

  const handleShowPlayer = (song) => {
    setSelectedSong(song);
    setIsPlayerVisible(true);
  };

  async function likeSong(songId) {
    try {
      setFavoriteLoading((prev) => {
        const next = new Set(prev);
        next.add(String(songId));
        return next;
      });

      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ song_id: songId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add favorite');
      }

      setLikedSongs((prev) => {
        const next = new Set(prev);
        next.add(String(songId));
        return next;
      });

      await loadFavorites();
      if (userId) {
        await loadForYou(userId);
      }
      return true;
    } catch (err) {
      console.error('Failed to add favorite:', err);
      return false;
    } finally {
      setFavoriteLoading((prev) => {
        const next = new Set(prev);
        next.delete(String(songId));
        return next;
      });
    }
  }

  async function unlikeSong(songId) {
    try {
      setFavoriteLoading((prev) => {
        const next = new Set(prev);
        next.add(String(songId));
        return next;
      });

      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/favorites/${songId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove favorite');
      }

      setLikedSongs((prev) => {
        const next = new Set(prev);
        next.delete(String(songId));
        return next;
      });

      await loadFavorites();
      if (userId) {
        await loadForYou(userId);
      }
      return true;
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      return false;
    } finally {
      setFavoriteLoading((prev) => {
        const next = new Set(prev);
        next.delete(String(songId));
        return next;
      });
    }
  }

  function toggleFavorite(songId) {
    if (favoriteLoading.has(String(songId))) return Promise.resolve(false);

    if (likedSongs.has(String(songId))) {
      return unlikeSong(songId);
    }
    return likeSong(songId);
  }

  useEffect(() => {
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (query) {
      handleSearch(query, type || 'Song');
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchType === 'Artist') {
      fetchArtistImages();
    } else {
      fetchSongImages();
    }
  }, [queryResults, searchType]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setSearchLoading(true);

      const type = searchType.toLowerCase() + 's';
      const offset = newPage * resultsPerPage;

      fetch(
        `http://${config.server_host}:${config.server_port}/search?q=${encodeURIComponent(currentQuery)}&type=${type}&limit=${resultsPerPage}&offset=${offset}`
      )
        .then((res) => res.json())
        .then((resJson) => {
          setQueryResults(resJson);
          setResultCount(resJson.length);
        })
        .catch((err) => console.error('Search error:', err))
        .finally(() => setSearchLoading(false));
    }
  };

  const handleNextPage = () => {
    if (resultCount === resultsPerPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setSearchLoading(true);

      const type = searchType.toLowerCase() + 's';
      const offset = newPage * resultsPerPage;

      fetch(
        `http://${config.server_host}:${config.server_port}/search?q=${encodeURIComponent(currentQuery)}&type=${type}&limit=${resultsPerPage}&offset=${offset}`
      )
        .then((res) => res.json())
        .then((resJson) => {
          setQueryResults(resJson);
          setResultCount(resJson.length);
        })
        .catch((err) => console.error('Search error:', err))
        .finally(() => setSearchLoading(false));
    }
  };

  const hasMoreResults = resultCount === resultsPerPage;

  return (
    <main className="page">
      <Header
        username={userName}
        onLogout={logout}
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
        onSearch={handleSearch}
      />

      <div className={`home-layout${isSideMenuOpen ? '' : ' home-layout--collapsed'}`}>
        <div
          className={`side-menu-panel${isSideMenuOpen ? '' : ' side-menu-panel--collapsed'}`}
        >
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
              currentQuery={currentQuery}
              hasMoreResults={hasMoreResults}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              selectedSong={selectedSong}
              isPlayerVisible={isPlayerVisible}
              onShowPlayer={handleShowPlayer}
              likedSongs={likedSongs}
              favoriteLoading={favoriteLoading}
              onToggleFavorite={toggleFavorite}
              searchLoading={searchLoading}
            />
            <RecommendationsColumn
              recentFavorites={recentFavorites}
              recommendations={recommendations}
              recentFavoriteImages={recentFavoriteImages}
              recImages={recImages}
              likedSongs={likedSongs}
              favoriteLoading={favoriteLoading}
              onToggleFavorite={toggleFavorite}
              loading={recommendationsLoading}
            />
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
  currentQuery,
  hasMoreResults,
  onPrevPage,
  onNextPage,
  selectedSong,
  isPlayerVisible,
  onShowPlayer,
  likedSongs,
  favoriteLoading,
  onToggleFavorite,
  searchLoading,
}) {
  const navigate = useNavigate();
  const [openMenuSongId, setOpenMenuSongId] = useState(null);

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

      {searchType === 'Song' && selectedSong && isPlayerVisible && (
        <PlayerContainer song={selectedSong} />
      )}

      {searchLoading && (
        <p>Loading results...</p>
      )}

      {!searchLoading && queryResults.length === 0 && !currentQuery && (
        <p>Use the search bar above to see results here.</p>
      )}

      {!searchLoading && queryResults.length === 0 && currentQuery && (
        <p>No results found.</p>
      )}

      {queryResults.length > 0 && (
        <div className="songs-list">
          {queryResults.map((result) =>
            searchType === 'Artist' ? (
              <ArtistCard
                key={result.artist_id}
                artist={result}
                image={artistImages[result.artist_id]}
                onClick={() => navigate(`/artist/${result.artist_id}`)}
              />
            ) : (
              <SongCard
                key={result.song_id}
                song={result}
                thumbnail={songImages[result.song_id]}
                onShowPlayer={() => onShowPlayer(result)}
                onGoToSong={() => navigate(`/song/${result.song_id}`)}
                isLiked={likedSongs.has(String(result.song_id))}
                isFavoriteLoading={favoriteLoading.has(String(result.song_id))}
                onToggleFavorite={() => onToggleFavorite(String(result.song_id))}
                menuOpen={openMenuSongId === result.song_id}
                onMenuToggle={() =>
                  setOpenMenuSongId((prev) =>
                    prev === result.song_id ? null : result.song_id
                  )
                }
                onCloseMenu={() => setOpenMenuSongId(null)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationsColumn({
  recentFavorites,
  recommendations,
  recentFavoriteImages,
  recImages,
  likedSongs,
  favoriteLoading,
  onToggleFavorite,
  loading,
}) {
  const navigate = useNavigate();
  const [openMenuSongId, setOpenMenuSongId] = useState(null);

  return (
    <div className="grid-column">
      <div className="column-header">
        <h2>For You</h2>
        <div className="nav-arrows">
          <button className="arrow-btn" disabled>
            ‹
          </button>
          <button className="arrow-btn" disabled>
            ›
          </button>
        </div>
      </div>

      {loading && <p>Loading recommendations...</p>}

      {!loading && recommendations.length > 0 && (
        <>
          <p className="section-subtitle">Based on your 3 most recent favorites:</p>
          <div className="songs-list">
            {recommendations.map((song) => (
              <SongCard
                key={`rec-${song.song_id}`}
                song={song}
                thumbnail={recImages[song.song_id]}
                onShowPlayer={() => {}}
                onGoToSong={() => navigate(`/song/${song.song_id}`)}
                isLiked={likedSongs.has(String(song.song_id))}
                isFavoriteLoading={favoriteLoading.has(String(song.song_id))}
                onToggleFavorite={() => onToggleFavorite(String(song.song_id))}
                menuOpen={openMenuSongId === `rec-${song.song_id}`}
                onMenuToggle={() =>
                  setOpenMenuSongId((prev) =>
                    prev === `rec-${song.song_id}` ? null : `rec-${song.song_id}`
                  )
                }
                onCloseMenu={() => setOpenMenuSongId(null)}
              />
            ))}
          </div>
        </>
      )}

      {!loading &&
        recentFavorites.length === 0 &&
        recommendations.length === 0 && (
          <p>No recommendations yet. Favorite a few songs to get started.</p>
        )}
    </div>
  );
}

function PlayerContainer({ song }) {
  if (!song) return null;

  return (
    <div className="player-container" onClick={(e) => e.stopPropagation()}>
      <iframe
        title={`Spotify player for ${song.song_name}`}
        src={`https://open.spotify.com/embed/track/${song.song_id}`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

function SongCard({
  song,
  thumbnail,
  onShowPlayer,
  onGoToSong,
  isLiked,
  isFavoriteLoading,
  onToggleFavorite,
  menuOpen,
  onMenuToggle,
  onCloseMenu,
}) {
  const navigate = useNavigate();

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const handleArtistClick = (e, artistId) => {
    e.stopPropagation();
    navigate(`/artist/${artistId}`);
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    onMenuToggle();
  };

  const handleShowPlayerClick = (e) => {
    e.stopPropagation();
    onShowPlayer();
    onCloseMenu();
  };

  const handleGoToSongClick = (e) => {
    e.stopPropagation();
    onGoToSong();
    onCloseMenu();
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    await onToggleFavorite();
    onCloseMenu();
  };

  useEffect(() => {
    const handleOutsideClick = () => onCloseMenu();

    if (menuOpen) {
      document.addEventListener('click', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [menuOpen, onCloseMenu]);

  return (
    <div
      className={`song-card${menuOpen ? ' song-card--menu-open' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="song-card-main">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={song.song_name}
            className="song-thumbnail"
            onError={handleImageError}
          />
        ) : (
          <div className="song-thumbnail placeholder-icon">
            <i className="fas fa-music"></i>
          </div>
        )}

        <div className="song-info">
          <p className="song-name" onClick={onGoToSong} style={{ cursor: 'pointer' }}>
            {song.song_name}
          </p>
          <p className="artists">
            {Array.isArray(song.artists) ? (
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
              ))
            ) : (
              song.artists
            )}
          </p>
        </div>
      </div>

      <div className="song-card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="song-menu-btn"
          onClick={handleMenuToggle}
          aria-label="Song options"
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="song-menu" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="song-menu-item"
              onClick={handleShowPlayerClick}
            >
              Listen to song
            </button>
            <button
              type="button"
              className="song-menu-item"
              onClick={handleGoToSongClick}
            >
              View song details
            </button>
            <button
              type="button"
              className="song-menu-item"
              onClick={handleFavoriteClick}
              disabled={isFavoriteLoading}
            >
              {isFavoriteLoading
                ? 'Saving...'
                : isLiked
                  ? 'Remove from favorites'
                  : 'Add to favorites'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistCard({ artist, image, onClick }) {
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className="artist-card" onClick={onClick}>
      {image ? (
        <img
          src={image}
          alt={artist.artist_name}
          className="artist-thumbnail"
          onError={handleImageError}
        />
      ) : (
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
