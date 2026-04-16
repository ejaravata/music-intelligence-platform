import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import config from '../config.json';

const SPOTIFY_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/';
const API_BASE_URL = `http://${config.server_host}:${config.server_port}`;

/* helper function to format date to mm/dd/yyyy */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/* custom tooltip to show attribute name and value on hover */
function AttributeTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: '#000',
        border: '1px solid #fff',
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '12px',
        minWidth: '120px'
      }}
    >
      <div
        style={{
          color: '#fff',
          fontWeight: 600,
          marginBottom: '6px'
        }}
      >
        {payload[0].payload.name}
      </div>
      <div style={{ color: '#fff' }}>
        Value: {payload[0].value}
      </div>
    </div>
  );
}

/* custom bar shape to use fill color from data */
function CustomBar(props) {
  const { fill, x, y, width, height, payload } = props;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={payload?.fill || fill}
      rx={4}
      ry={4}
    />
  );
}

export default function SongInfo() {
  const { songId } = useParams();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [songThumbnail, setSongThumbnail] = useState(null);
  const [songData, setSongData] = useState(null);
  const [billboardData, setBillboardData] = useState(null);
  const [grammyData, setGrammyData] = useState(null);
  const [showBillboardTooltip, setShowBillboardTooltip] = useState(false);
  const [showGrammyTooltip, setShowGrammyTooltip] = useState(false);
  const [key, setKey] = useState('');
  const [mainGenre, setMainGenre] = useState('');
  const [subgenres, setSubgenres] = useState([]);
  const [tempo, setTempo] = useState('');
  const [loudness, setLoudness] = useState('');
  const [artists, setArtists] = useState([]);
  const [userName, setUserName] = useState("User");
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [relatedSongImages, setRelatedSongImages] = useState({});
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

  useEffect(() => {
    setShowBillboardTooltip(false);
    setShowGrammyTooltip(false);
  }, [songId]);

  useEffect(() => {
    if (songId) {
      fetch(`${SPOTIFY_OEMBED_URL}${songId}`)
        .then(res => res.json())
        .then(data => {
          setSongThumbnail(data.thumbnail_url);
        })
        .catch(err => console.error('Image fetch error:', err));
    }
  }, [songId]);

  useEffect(() => {
    if (songId) {
      fetch(`${API_BASE_URL}/song/${songId}`)
        .then(res => res.json())
        .then(data => {
          setSongData(data);
          setKey(data.key || '');
          setMainGenre(data.main_genre || '');
          setSubgenres(data.subgenres ? data.subgenres.split(', ') : []);
          setTempo(data.tempo || '');
          setLoudness(data.loudness || '');
          setArtists(Array.isArray(data.artists) ? data.artists : []);
        })
        .catch(err => console.error('Song info fetch error:', err));
    }
  }, [songId]);

  useEffect(() => {
    if (songId) {
      fetch(`${API_BASE_URL}/songs/${songId}/recommendations/audio_attributes`)
        .then(res => res.json())
        .then(data => {
          console.log('Related songs response for', songId, ':', data);
          setRelatedSongs(data);
        })
        .catch(err => console.error('Related songs fetch error:', err));
    }
  }, [songId]);

  const fetchRelatedSongImages = () => {
    relatedSongs.forEach((song) => {
      fetch(`${SPOTIFY_OEMBED_URL}${song.song_id}`)
        .then(res => res.json())
        .then(data => {
          setRelatedSongImages(prev => ({
            ...prev,
            [song.song_id]: data.thumbnail_url
          }));
        })
        .catch(err => console.error('Image fetch error:', err));
    });
  };

  useEffect(() => {
    if (relatedSongs.length > 0) {
      fetchRelatedSongImages();
    }
  }, [relatedSongs]);

  useEffect(() => {
    if (songId) {
      fetch(`${API_BASE_URL}/billboard/song/${songId}`)
        .then(res => res.json())
        .then(data => {
          setBillboardData(data && data.peak_rank ? data : null);
        })
        .catch(err => console.error('Billboard data fetch error:', err));
    }
  }, [songId]);

  useEffect(() => {
    if (songId) {
      fetch(`${API_BASE_URL}/grammys/song/${songId}`)
        .then(res => res.json())
        .then(data => {
          setGrammyData(data && data.artists && data.artists.length > 0 ? data : null);
        })
        .catch(err => console.error('Grammy data fetch error:', err));
    }
  }, [songId]);

  const attributeColors = [
    '#e6194B',
    '#f58231',
    '#ffe119',
    '#aaffc3',
    '#3cb44b',
    '#42d4f4',
    '#4363d8',
    '#911eb4'
  ];

  const songAttributes = songData ? [
    { name: 'Energy', value: Math.round((songData.energy ?? 0) * 100), fill: attributeColors[0] },
    { name: 'Danceability', value: Math.round((songData.danceability ?? 0) * 100), fill: attributeColors[1] },
    { name: 'Valence', value: Math.round((songData.valence ?? 0) * 100), fill: attributeColors[2] },
    { name: 'Acousticness', value: Math.round((songData.acousticness ?? 0) * 100), fill: attributeColors[3] },
    { name: 'Instrumentalness', value: Math.round((songData.instrumentalness ?? 0) * 100), fill: attributeColors[4] },
    { name: 'Liveness', value: Math.round((songData.liveness ?? 0) * 100), fill: attributeColors[5] },
    { name: 'Speechiness', value: Math.round((songData.speechiness ?? 0) * 100), fill: attributeColors[6] },
    { name: 'Popularity', value: Math.round(songData.popularity ?? 0), fill: attributeColors[7] }
  ] : [];

  const handleSongClick = (songId) => {
    navigate(`/song/${songId}`);
  };

  const handleArtistClick = (e, artistId) => {
    e.stopPropagation();
    navigate(`/artist/${artistId}`);
  };

  return (
    <main className="page">
      <Header
        siteName="Song Info"
        username={userName}
        onLogout={logout}
        showSearch={false}
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
              <div className="info-thumbnail song-thumbnail placeholder-icon">
                {songThumbnail ? (
                  <img
                    src={songThumbnail}
                    alt="Song thumbnail"
                    className="thumbnail-image"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <i className="fas fa-music"></i>
                )}
              </div>
              <div className="info-details-text">
                <h1 className="info-title">{songData?.song_name || 'Song Title'}</h1>
                <p className="info-subtitle">
                  {artists.length > 0 ? (
                    artists.map((artist, index) => (
                      <span key={artist.artist_id}>
                        <span
                          className="artist-link"
                          onClick={(e) => handleArtistClick(e, artist.artist_id)}
                        >
                          {artist.artist_name}
                        </span>
                        {index < artists.length - 1 && <span>, </span>}
                      </span>
                    ))
                  ) : (
                    'Artist Name'
                  )}
                </p>
                <div className="icons-wrapper">
                  {billboardData && (
                    <div 
                      className="billboard-icon-wrapper"
                      onMouseEnter={() => setShowBillboardTooltip(true)}
                      onMouseLeave={() => setShowBillboardTooltip(false)}
                    >
                      <i className="fas fa-fire" style={{ color: '#ff6b35', fontSize: '20px' }}></i>
                      {showBillboardTooltip && (
                        <div className="billboard-tooltip">
                          <span className="billboard-tooltip-title">Billboard Top 100</span>
                          <span className="billboard-tooltip-item">Highest Rank Reached:</span> #{billboardData.peak_rank}
                          <br />
                          <span className="billboard-tooltip-item">Weeks on Chart:</span> {billboardData.weeks_on_board}
                          <br />
                          <span className="billboard-tooltip-item">First Appearance:</span> {formatDate(billboardData.first_appearance)}
                          <br />
                          <span className="billboard-tooltip-item">Last Appearance:</span> {formatDate(billboardData.last_appearance)}
                        </div>
                      )}
                    </div>
                  )}
                  {grammyData && (
                    <div 
                      className="grammy-icon-wrapper"
                      onMouseEnter={() => setShowGrammyTooltip(true)}
                      onMouseLeave={() => setShowGrammyTooltip(false)}
                    >
                      <i className="fas fa-trophy" style={{ color: '#ffd700', fontSize: '20px' }}></i>
                      {showGrammyTooltip && (
                        <div className="grammy-tooltip">
                          <span className="grammy-tooltip-title">Grammy Nominations (gold = win)</span>
                          {grammyData.artists && grammyData.artists.map((nomination, index) => (
                            <div 
                              key={index}
                              className={`grammy-tooltip-item ${nomination.winner ? 'grammy-tooltip-win' : ''}`}
                            >
                              {nomination.award} ({nomination.year})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {songId && (
              <div className="spotify-embed-container">
                <iframe
                  style={{ borderRadius: '12px' }}
                  src={`https://open.spotify.com/embed/track/${songId}`}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allowFullScreen=""
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              </div>
            )}

            <div className="home-grid">
              <div className="song-attributes-section">
                <h2>Song Attributes</h2>
                <div className="song-metadata">
                  <p className="metadata-line"><span className="metadata-label">Main Genre:</span> {(mainGenre || 'N/A').toLowerCase()}</p>
                  <p className="metadata-line"><span className="metadata-label">Subgenre(s):</span> {subgenres.length > 0 ? subgenres.join(', ') : 'N/A'}</p>
                  <p className="metadata-line"><span className="metadata-label">Key:</span> {key || 'N/A'}</p>
                  <p className="metadata-line"><span className="metadata-label">Tempo (BPM):</span> {tempo || 'N/A'}</p>
                  <p className="metadata-line"><span className="metadata-label">Loudness (dB):</span> {loudness || 'N/A'}</p>
                </div>
                <div className="attributes-chart-wrapper">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={songAttributes}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDsharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#fff', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#999', fontSize: 12 }}
                      />
                      <Tooltip
                        content={<AttributeTooltip />}
                        cursor={{ fill: '#fff', fillOpacity: 0.4 }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        shape={<CustomBar />}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid-column">
                <div className="column-header">
                  <h2>Related Songs</h2>
                </div>
                <div className="songs-list">
                  {relatedSongs.map((song) => (
                    <SongCard
                      key={song.song_id}
                      song={song}
                      thumbnail={relatedSongImages[song.song_id]}
                      onClick={() => handleSongClick(song.song_id)}
                      onArtistClick={handleArtistClick}
                    />
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

function SongCard({ song, thumbnail, onClick, onArtistClick }) {
  const handleImageError = (e) => {
    e.target.style.display = 'none';
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
                  onClick={(e) => onArtistClick(e, artist.artist_id)}
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
