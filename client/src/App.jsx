import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Overview from "./pages/Overview.jsx";
import GrammyAnalytics from "./pages/GrammyAnalytics.jsx";
import BillboardAnalytics from "./pages/BillboardAnalytics.jsx";
import Favorites from "./pages/Favorites.jsx";
import SongInfo from "./pages/SongInfo.jsx";
import ArtistInfo from "./pages/ArtistInfo.jsx";
import Details from "./pages/Details.jsx";

// added path for both analytics and grammy-analytics since had some issues with 
// the path, bc it didn't connect properly. 
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/details" element={<Details />} />
        <Route path="/analytics" element={<GrammyAnalytics />} />
        <Route path="/grammy-analytics" element={<GrammyAnalytics />} />
        <Route path="/billboard-analytics" element={<BillboardAnalytics />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/song/:songId" element={<SongInfo />} />
        <Route path="/artist/:artistId" element={<ArtistInfo />} />
      </Routes>
    </BrowserRouter>
  );
}
