import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Overview from "./pages/Overview.jsx";
import GrammyAnalytics from "./pages/GrammyAnalytics.jsx";
import BillboardAnalytics from "./pages/BillboardAnalytics.jsx";
import Favorites from "./pages/Favorites.jsx";
import SongInfo from "./pages/SongInfo.jsx";
import ArtistInfo from "./pages/ArtistInfo.jsx";
import Details from "./pages/Details.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import config from "./config.json";

const BASE_URL = `http://${config.server_host}:${config.server_port}`;

export default function App() {
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${BASE_URL}/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(false);
          return;
        }

        const data = await res.json();
        setUser(data || false);
      } catch (err) {
        console.error("Failed to check auth:", err);
        setUser(false);
      } finally {
        setCheckedAuth(true);
      }
    }

    loadUser();
  }, []);

  if (!checkedAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <Login setUser={setUser} />}/>       
        <Route path="/home" element={<ProtectedRoute user={user}><Home /></ProtectedRoute>}/>
        <Route path="/overview" element={<ProtectedRoute user={user}><Overview /></ProtectedRoute>} />
        <Route path="/details" element={<ProtectedRoute user={user}><Details /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute user={user}><GrammyAnalytics /></ProtectedRoute>} />
        <Route path="/grammy-analytics" element={<ProtectedRoute user={user}><GrammyAnalytics /></ProtectedRoute>} />
        <Route path="/billboard-analytics" element={<ProtectedRoute user={user}><BillboardAnalytics /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute user={user}><Favorites /></ProtectedRoute>} />
        <Route path="/song/:songId" element={<ProtectedRoute user={user}><SongInfo /></ProtectedRoute>} />
        <Route path="/artist/:artistId" element={<ProtectedRoute user={user}><ArtistInfo /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
