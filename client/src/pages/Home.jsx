import { useState } from "react";
import Header from "../components/Header.jsx";
import SideMenu from "../components/SideMenu.jsx";

export default function Home() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);

  return (
    <main className="page">
      <Header
        siteName="CIS 5500"
        username="user"
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
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
              {/* embeds are placeholders - will change this to be boxes with clickable song, artist, and album */}
              <div className="spotify-embeds">
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
              <div className="spotify-embeds">
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
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
