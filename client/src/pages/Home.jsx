import { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';
import config from '../config.json';

export default function Home() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [queryResults, setQueryResults] = useState([]);
  const [songImages, setSongImages] = useState({});

  const search = (query) => {
    fetch(`http://${config.server_host}:${config.server_port}/songs/search?q=${query}`)
    .then(res => res.json())
    .then(resJson => setQueryResults(resJson))
    .catch(err => console.log('Error:', err))
  }

  // fetch Spotify image for each song
  useEffect(() => {
    queryResults.forEach((song) => {
      fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/track/${song.song_id}`)
        .then(res => res.json())
        .then(data => {
          setSongImages(prev => ({
            ...prev,
            [song.song_id]: data.thumbnail_url
          }))
        })
        .catch(err => console.log('Error fetching image:', err))
    })
  }, [queryResults])

  return (
    <main className="page">
      <Header
        siteName="CIS 5500"
        username="user"
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
        onSearch={search}
      />

      <div className={`home-layout${isSideMenuOpen ? "" : " home-layout--collapsed"}`}>
        <div className={`side-menu-panel${isSideMenuOpen ? "" : " side-menu-panel--collapsed"}`}>
          <SideMenu />
        </div>

        <section className="page-content">
          <div className="home-grid">
            <div className="grid-column">
              <div className="column-header">
                <h2>Results</h2>
                <div className="nav-arrows">
                  <button className="arrow-btn">‹</button>
                  <button className="arrow-btn">›</button>
                </div>
              </div>
              
              <div>
                {queryResults.map((song) => (
                  <div key={song.song_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                    {songImages[song.song_id] && (
                      <img src={songImages[song.song_id]} alt={song.song_name} style={{ width: '100px', flexShrink: 0 }} />
                    )}
                    <div>
                      <p style={{ margin: '0' }}>{song.song_id}</p>
                      <p style={{ margin: '0' }}>{song.song_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid-column">
              <div className="column-header">
                <h2>Recommendations</h2>
                <div className="nav-arrows">
                  <button className="arrow-btn">‹</button>
                  <button className="arrow-btn">›</button>
                </div>
              </div>
              {/* <div className="spotify-embeds">
                {[1, 2, 3].map((i) => (
                  <iframe
                    key={i}
                    src="https://open.spotify.com/embed/track/4PTG3Z6ehGkBFwjybzWkR8?utm_source=generator"
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allowFullScreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                ))}
              </div> */}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
