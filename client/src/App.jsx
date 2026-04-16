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
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import config from "./config.json";

const BASE_URL = `http://${config.server_host}:${config.server_port}`;

export default function App() {
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 5000);

        const res = await fetch(`${BASE_URL}/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!isMounted) return;

        if (!res.ok) {
          setUser(false);
          return;
        }

        const data = await res.json();
        setUser(data || false);
      } catch (err) {
        console.error("Failed to check auth:", err);
        if (isMounted) {
          setUser(false);
        }
      } finally {
        if (isMounted) {
          setCheckedAuth(true);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);
  
  if (!checkedAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        Checking session...
      </div>
    );
  }

  async function handleLogout() {
    try {
      const res = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Logout request failed");
      }

      setUser(false);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <Login setUser={setUser} />}/>       
        <Route path="/home" element={<ProtectedRoute user={user}><Home onLogout={handleLogout}/></ProtectedRoute>}/>
        <Route path="/overview" element={<ProtectedRoute user={user}><Overview onLogout={handleLogout}/></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute user={user}><GrammyAnalytics onLogout={handleLogout}/></ProtectedRoute>} />
        <Route path="/grammy-analytics" element={<ProtectedRoute user={user}><GrammyAnalytics onLogout={handleLogout}/></ProtectedRoute>} />
        <Route path="/billboard-analytics" element={<ProtectedRoute user={user}><BillboardAnalytics onLogout={handleLogout}/></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute user={user}><Favorites onLogout={handleLogout}/></ProtectedRoute>} />
        <Route path="/song/:songId" element={<ProtectedRoute user={user}><SongInfo onLogout={handleLogout}/></ProtectedRoute>} />
        <Route path="/artist/:artistId" element={<ProtectedRoute user={user}><ArtistInfo onLogout={handleLogout}/></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
