import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';

export default function ArtistInfo() {
//   const { artistId } = useParams();
  const navigate = useNavigate();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);

  // placeholders
  const artistName = 'Artist Name';
  const placeholderSongs = [
    { song_id: '1', song_name: 'Song Title 1', artists: 'Artist Name' },
    { song_id: '2', song_name: 'Song Title 2', artists: 'Artist Name' },
    { song_id: '3', song_name: 'Song Title 3', artists: 'Artist Name' },
    { song_id: '4', song_name: 'Song Title 4', artists: 'Artist Name' },
    { song_id: '5', song_name: 'Song Title 4', artists: 'Artist Name' }
  ];
  const relatedArtists = [
    { artist_id: '1', artist_name: 'Related Artist 1' },
    { artist_id: '2', artist_name: 'Related Artist 2' },
    { artist_id: '3', artist_name: 'Related Artist 3' },
    { artist_id: '3', artist_name: 'Related Artist 4' },
    { artist_id: '3', artist_name: 'Related Artist 5' }
  ];

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
                <i className="fas fa-user"></i>
              </div>
              <div className="info-details-text">
                <h1 className="info-title">{artistName}</h1>
                <p className="info-subtitle">
                  {placeholderSongs.length} song{placeholderSongs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="home-grid">
              <div className="grid-column">
                <div className="column-header">
                  <h2>Songs by this Artist</h2>
                </div>
                <div className="songs-list">
                  {placeholderSongs.map((song) => (
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
                        <i className="fas fa-user"></i>
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
