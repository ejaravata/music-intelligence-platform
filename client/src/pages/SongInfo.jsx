import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import config from '../config.json';

const SPOTIFY_OEMBED_URL = 'https://open.spotify.com/oembed?url=https://open.spotify.com/track/';
const API_BASE_URL = `http://${config.server_host}:${config.server_port}`;

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
  const [key, setKey] = useState('');
  const [mainGenre, setMainGenre] = useState('');
  const [subgenres, setSubgenres] = useState([]);
  const [tempo, setTempo] = useState('');
  const [loudness, setLoudness] = useState('');

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
        })
        .catch(err => console.error('Song info fetch error:', err));
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

  const relatedSongs = [
    { song_id: '1', song_name: 'Related Song 1', artists: 'Artist Name' },
    { song_id: '2', song_name: 'Related Song 2', artists: 'Artist Name' },
    { song_id: '3', song_name: 'Related Song 3', artists: 'Artist Name' },
    { song_id: '4', song_name: 'Related Song 4', artists: 'Artist Name' },
    { song_id: '5', song_name: 'Related Song 5', artists: 'Artist Name' }
  ];

  const songGenres = ['Pop', 'Electronic'];
  const musicKey = 'C Major';

  const handleSongClick = (songId) => {
    // TODO: click to view song details
  };

  return (
    <main className="page">
      <Header
        siteName="Song Info"
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
                <p className="info-subtitle">Artist Name</p>
              </div>
            </div>

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
                    <div
                      key={song.song_id}
                      className="song-card"
                      onClick={() => handleSongClick(song.song_id)}
                    >
                      <div className="song-thumbnail placeholder-icon">
                        <i className="fas fa-music"></i>
                      </div>
                      <div className="song-info">
                        <p className="song-name">{song.song_name}</p>
                        <p className="artists">{song.artists}</p>
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
