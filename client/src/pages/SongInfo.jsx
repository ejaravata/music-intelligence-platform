import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SideMenu from '../components/SideMenu.jsx';

export default function SongInfo() {
//   const { songId } = useParams();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);

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
                <i className="fas fa-music"></i>
              </div>
              <div className="info-details-text">
                <h1 className="info-title">Song Title</h1>
                <p className="info-subtitle">Artist Name</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
