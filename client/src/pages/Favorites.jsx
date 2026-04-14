import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "../favorites.css";
import "../auth.css";
import SideMenu from "../components/SideMenu.jsx";
import Header from "../components/Header.jsx";

const BASE_URL = "http://localhost:8080";

const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="8" fill="#111111"/>
      <rect x="1" y="1" width="78" height="78" rx="7" fill="none" stroke="#333333"/>
      <circle cx="28" cy="28" r="8" fill="#555555"/>
      <path d="M20 56l12-12 8 8 10-10 10 14H20z" fill="#444444"/>
    </svg>
  `);

export default function Favorites() {
  const navigate = useNavigate();

  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userName, setUserName] = useState("User");

  const [allSongs, setAllSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  const [genres, setGenres] = useState([]);
  const [attributeType, setAttributeType] = useState("energetic");
  const [attributes, setAttributes] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const playerRef = useRef(null);
  const songsAreaRef = useRef(null);
  const songsWrapperRef = useRef(null);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return allSongs;

    return allSongs.filter((s) =>
      (s.song_name && s.song_name.toLowerCase().includes(query)) ||
      (s.artists && s.artists.toLowerCase().includes(query)) ||
      (s.album_name && s.album_name.toLowerCase().includes(query))
    );
  }, [allSongs, searchQuery]);

  async function logout() {
    try {
      await fetch(`${BASE_URL}/logout`, {
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }

    setCurrentUserId(null);
    setUserName("User");
    setAllSongs([]);
    setGenres([]);
    setAttributes([]);
    setCurrentPlayingId(null);
    setSearchQuery("");
    setIsLoggedIn(false);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    navigate("/", { replace: true });
  }

  async function loadFavoriteSongs(userId) {
    const res = await fetch(`${BASE_URL}/user/favorite_songs/${userId}`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to load favorite songs");
    }

    const songs = await res.json();
    setAllSongs(Array.isArray(songs) ? songs : []);
  }

  async function loadProfile(userId) {
    const res = await fetch(`${BASE_URL}/user/top_genres/${userId}`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to load profile");
    }

    const data = await res.json();
    setGenres(Array.isArray(data) ? data : []);
  }

  async function loadAttributes(userId, type) {
    if (!userId || !type) {
      setAttributes([]);
      return;
    }

    let endpoint = "";

    if (type === "energetic") {
      endpoint = `${BASE_URL}/user/most_energetic_songs/${userId}`;
    } else if (type === "sad") {
      endpoint = `${BASE_URL}/user/most_sad_songs/${userId}`;
    } else {
      setAttributes([]);
      return;
    }

    const res = await fetch(endpoint, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to load attributes");
    }

    const data = await res.json();
    setAttributes(Array.isArray(data) ? data : []);
  }

  async function loadUser() {
    try {
      const res = await fetch(`${BASE_URL}/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setIsLoggedIn(false);
        return;
      }

      const user = await res.json();
      const id = user.id;

      const fullName =
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.name || user.email || "User";

      setCurrentUserId(id);
      setUserName(fullName);
      setIsLoggedIn(true);

      await Promise.all([loadFavoriteSongs(id), loadProfile(id)]);
      await loadAttributes(id, "energetic");
    } catch (err) {
      console.error("Failed to load user:", err);
      setIsLoggedIn(false);
    }
  }

  function toggleSong(songId) {
    setCurrentPlayingId((prev) => (prev === songId ? null : songId));
  }

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadAttributes(currentUserId, attributeType).catch((err) => {
      console.error(err);
      setAttributes([]);
    });
  }, [currentUserId, attributeType]);

  useEffect(() => {
    if (!chartRef.current || !genres.length) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = genres.map((g) => g.genre);
    const values = genres.map((g) => Number(g.num_favorites));

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Top Genres",
            data: values,
            backgroundColor: "#4caf50",
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 18,
            hoverBackgroundColor: "#6cff93",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: "#a8a8a8" },
            grid: { color: "rgba(255,255,255,0.08)" },
          },
          y: {
            ticks: { color: "#d0d0d0", autoSkip: false },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [genres]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!currentPlayingId) return;

      const clickedSongsArea = songsAreaRef.current?.contains(e.target);
      const clickedPlayer = playerRef.current?.contains(e.target);

      if (!clickedSongsArea && !clickedPlayer) {
        setCurrentPlayingId(null);
      }
    }

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [currentPlayingId]);

  useEffect(() => {
    const wrapper = songsWrapperRef.current;
    if (!wrapper) return;

    function handleScroll() {
      wrapper.classList.toggle("scrolled", wrapper.scrollTop > 0);
    }

    wrapper.addEventListener("scroll", handleScroll);
    return () => wrapper.removeEventListener("scroll", handleScroll);
  }, []);

  const attributeMetric = attributeType === "sad" ? "valence" : "energy";

  return (
    <div className="favorites-page">
      <Header
        siteName="CIS5500 Final Project: User Favorites"
        username={userName}
        onLogout={logout}
        showSearch={false}
        onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
      />

      <div
        className={`favorites-layout ${
          isSideMenuOpen ? "" : "favorites-layout--collapsed"
        }`}
      >
        <div
          className={`side-menu-panel ${
            isSideMenuOpen ? "" : "side-menu-panel--collapsed"
          }`}
        >
          <SideMenu />
        </div>

        {isLoggedIn ? (
          <div id="app-section">
            <div id="topbar">
              <div id="search-container">
                <input
                  id="searchBox"
                  placeholder="Search liked songs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div id="container">
              <div id="main-panel">
                <div className="panel-header">
                  <h2>Liked Songs</h2>
                  <p className="auth-subtitle">
                    <i>Select a song to preview it</i>
                  </p>
                </div>

                <div
                  id="player-container"
                  className="player-container"
                  ref={playerRef}
                  style={{ display: currentPlayingId ? "block" : "none" }}
                >
                  {currentPlayingId ? (
                    <iframe
                      className="spotify-player"
                      src={`https://open.spotify.com/embed/track/${currentPlayingId}?utm_source=generator`}
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      title="Spotify player"
                    />
                  ) : (
                    <div className="player-placeholder">
                      Select a song to preview it
                    </div>
                  )}
                </div>

                <div id="songs-wrapper" ref={songsWrapperRef}>
                  <div id="songs" ref={songsAreaRef}>
                    {filteredSongs.length === 0 ? (
                      <p>No favorite songs found.</p>
                    ) : (
                      <div className="songs-list">
                        {filteredSongs.map((s, i) => (
                          <div
                            key={s.song_id ?? `${s.song_name}-${i}`}
                            className={`song-card ${
                              currentPlayingId === s.song_id ? "active" : ""
                            }`}
                            onClick={() => toggleSong(s.song_id)}
                          >
                            <div className="song-rank">{i + 1}</div>

                            <img
                              className="album-art"
                              src={s.image_url || FALLBACK_COVER}
                              alt={s.song_name ?? "Album cover"}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_COVER;
                              }}
                            />

                            <div className="song-info">
                              <div className="song-title">
                                {s.song_name ?? "N/A"}
                              </div>
                              <div className="song-artists">
                                {s.artists ?? "N/A"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div id="right-panel">
                <div id="chart-panel">
                  <h3>Top Genres</h3>
                  <div className="chart-wrapper">
                    <canvas id="chart" ref={chartRef}></canvas>
                  </div>
                </div>

                <div id="attributes-panel">
                  <div className="panel-header">
                    <h3>Audio Attributes</h3>
                    <select
                      id="attribute-select"
                      value={attributeType}
                      onChange={(e) => setAttributeType(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="energetic">Most Energetic</option>
                      <option value="sad">Most Sad</option>
                    </select>
                  </div>

                  <div id="attributes">
                    {!attributes.length ? (
                      <p>No results found.</p>
                    ) : (
                      <div className="attr-list fade-in">
                        {attributes.map((s, i) => {
                          const rawValue = Number(s[attributeMetric] ?? 0);
                          const pct = Math.max(5, Math.min(100, rawValue * 100));

                          return (
                            <div
                              className="attr-card"
                              key={s.song_id ?? `${s.song_name}-${i}`}
                            >
                              <div className="attr-rank">{i + 1}</div>

                              <img
                                className="album-art"
                                src={s.image_url || FALLBACK_COVER}
                                alt={s.song_name ?? "Album cover"}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = FALLBACK_COVER;
                                }}
                              />

                              <div className="attr-info">
                                <div className="attr-song-title">
                                  {s.song_name ?? "N/A"}
                                </div>
                                <div className="attr-song-artists">
                                  {s.artists ?? "N/A"}
                                </div>
                              </div>

                              <div className="attr-bar">
                                <div
                                  className="attr-fill"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="login-section">
            <p>Please log in to view your favorites.</p>
          </div>
        )}
      </div>
    </div>
  );
}
