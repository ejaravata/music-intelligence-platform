import { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../analytics.css";
import config from "../config.json";
import SideMenu from "../components/SideMenu.jsx";
import Header from "../components/Header.jsx";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from "recharts";

/* custom tooltip to show genre and score */
function CustomTrendTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#000",
        border: "1px solid #fff",
        borderRadius: "6px",
        padding: "8px 10px",
        fontSize: "12px",
        minWidth: "140px"
      }}
    >
      <div
        style={{
          color: "#fff",
          fontWeight: 600,
          marginBottom: "6px"
        }}
      >
        {label}
      </div>
      <div style={{ color: "#fff" }}>
        Score: {Number(payload[0].value).toFixed(2)}
      </div>
    </div>
  );
}

/* tooltip for top songs chart to show song name, artist(s), and appearances */
function CustomTopSongsTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: "#000",
        border: "1px solid #fff",
        borderRadius: "6px",
        padding: "10px 12px",
        fontSize: "12px",
        minWidth: "220px"
      }}
    >
      <div
        style={{
          color: "#fff",
          fontWeight: 700,
          marginBottom: "6px"
        }}
      >
        {data.song_name}
      </div>
      <div style={{ color: "#fff", marginBottom: "4px" }}>
        Artist(s): {data.artist_names || "Unknown"}
      </div>
      <div style={{ color: "#fff" }}>
        Appearances: {data.appearances}
      </div>
    </div>
  );
}

/* function to create rounded bars for genre popularity chart */
function GenreBarShape(props) {
  const { x, y, width, height, payload } = props;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={6}
      ry={6}
      fill={payload.fill}
    />
  );
}

/* function to truncate long song names in the top songs chart, cuz they sometimes go
offscreen */
const truncateLabel = (label, maxLen = 16) => {
  if (!label) return "";
  return label.length > maxLen ? `${label.slice(0, maxLen)}...` : label;
};

export default function BillboardAnalytics() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [genreHistoryRows, setGenreHistoryRows] = useState([]);
  const [topTrendGenres, setTopTrendGenres] = useState([]);
  const [selectedYear, setSelectedYear] = useState(1959);
  const [topArtistData, setTopArtistData] = useState([]);
  const [annualTopSongs, setAnnualTopSongs] = useState([]);
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();

  const genreColors = [
    "#e6194B",
    "#f58231",
    "#ffe119",
    "#9A6324",
    "#aaffc3",
    "#3cb44b",
    "#42d4f4",
    "#4363d8",
    "#911eb4",
    "#f032e6"
  ];

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
            
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/billboard/genre_popularity_over_time`)
      .then((res) => res.json())
      .then((data) => {
        /* rewrite data so it can be easily used for trend chart */
        const cleaned = data.map((row) => ({
          year: new Date(row.week_ending_date).getFullYear(),
          genre: row.genre,
          normalized_popularity_score: Number(row.normalized_popularity_score)
        }));

        const genreTotals = {};
        cleaned.forEach((row) => {
          genreTotals[row.genre] =
            (genreTotals[row.genre] || 0) + row.normalized_popularity_score;
        });

        const topGenres = Object.entries(genreTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([genre]) => genre);

        const availableYears = cleaned.map((row) => row.year);
        const minYear = Math.min(...availableYears);

        setSelectedYear(minYear);
        setTopTrendGenres(topGenres);
        setGenreHistoryRows(cleaned);
      })
      .catch((err) => console.log(err));

    fetch(`http://${config.server_host}:${config.server_port}/billboard/artists`)
      .then((res) => res.json())
      .then((data) =>
        setTopArtistData(
          data.slice(0, 10).map((row) => ({
            ...row,
            total_entries: Number(row.total_entries),
            normalized_score: Number(row.normalized_score)
          }))
        )
      )
      .catch((err) => console.log(err));

    fetch(`http://${config.server_host}:${config.server_port}/billboard/annual_top_songs`)
      .then((res) => res.json())
      .then((data) =>
        setAnnualTopSongs(
          data.map((row) => ({
            year: Number(row.year),
            song_name: row.song_name,
            artist_names: row.artist_names,
            appearances: Number(row.appearances)
          }))
        )
      )
      .catch((err) => console.log(err));
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

  const tooltipStyle = {
    backgroundColor: "#000",
    border: "1px solid #fff",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "12px"
  };

  /* finds min and max years across dataset for slider bounds */
  const allYears = useMemo(() => {
    const yearsFromGenres = genreHistoryRows.map((row) => row.year);
    const yearsFromSongs = annualTopSongs.map((row) => row.year);
    const combined = [...yearsFromGenres, ...yearsFromSongs];

    if (combined.length === 0) {
      return { minYear: 1959, maxYear: 2024 };
    }

    return {
      minYear: Math.min(...combined),
      maxYear: Math.max(...combined)
    };
  }, [genreHistoryRows, annualTopSongs]);

  /* color map to assign consistent colors to genres in top trend chart, 
  even if they move */
  const genreColorMap = useMemo(() => {
    return Object.fromEntries(
      topTrendGenres.map((genre, index) => [
        genre,
        genreColors[index % genreColors.length]
      ])
    );
  }, [topTrendGenres]);
  /* instead of cumulative score, we use score for each year */
  const yearlyGenreData = useMemo(() => {
    return topTrendGenres
      .map((genre) => {
        const score = genreHistoryRows
          .filter((row) => row.genre === genre && row.year === selectedYear)
          .reduce((sum, row) => sum + row.normalized_popularity_score, 0);

        return {
          genre,
          score: Number(score.toFixed(2)),
          fill: genreColorMap[genre]
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [genreHistoryRows, topTrendGenres, selectedYear, genreColorMap]);

  const selectedYearTopSongs = useMemo(() => {
    return annualTopSongs
      .filter((row) => row.year === selectedYear)
      .sort((a, b) => b.appearances - a.appearances || a.song_name.localeCompare(b.song_name))
      .slice(0, 5);
  }, [annualTopSongs, selectedYear]);

  return (
    <div className="analytics-page">
      <Header
        siteName="Billboard Analytics"
        username={userName}
        onLogout={logout}
        onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
      />

      <div
        className={`analytics-layout ${
          isSideMenuOpen ? "" : "analytics-layout--collapsed"
        }`}
      >
        <div
          className={`side-menu-panel ${
            isSideMenuOpen ? "" : "side-menu-panel--collapsed"
          }`}
        >
          <SideMenu />
        </div>

        <main className="analytics-content">
          <div className="analytics-grid">
            <div className="analytics-card analytics-card--wide">
              <h2>Genre Popularity in {selectedYear}</h2>
              <p className="analytics-card-note">
                Note: popularity score is derived from Billboard rankings, where higher-ranked songs contribute
                more (101 − rank). Scores are averaged within each genre.
              </p>

              <div className="year-slider-wrapper">
                <input
                  type="range"
                  min={allYears.minYear}
                  max={allYears.maxYear}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="year-slider"
                />
                <div className="year-slider-label">{selectedYear}</div>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyGenreData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      type="number"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 12 }}
                      label={{
                        value: "Popularity Score",
                        position: "insideBottom",
                        offset: -5,
                        style: { fill: "#fff", fontSize: 13 }
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="genre"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 13 }}
                      width={100}
                    />
                    <Tooltip
                      content={<CustomTrendTooltip />}
                      cursor={{ fill: "#fff", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="score"
                      shape={<GenreBarShape />}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h2>Top 10 Billboard Artists</h2>
              <p className="analytics-card-note">
                Note: artists are ranked by total Billboard chart entries across the dataset
                (how many times they show up).
              </p>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topArtistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="artist_name"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 11 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 12 }}
                      label={{
                        value: "Entries",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fill: "#fff",
                          fontSize: 14
                        }
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#fff", marginBottom: "4px" }}
                      itemStyle={{ color: "#fff", padding: 0 }}
                      cursor={{ fill: "#fff", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="total_entries"
                      fill="#1e90ff"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h2>Top 5 Songs in {selectedYear}</h2>
              <p className="analytics-card-note">
                Note: this chart shows the songs with the most Billboard appearances in the selected year.
                Year is chosen by the slider in the above chart. If you hover over a bar, you can also see the artist(s).
              </p>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedYearTopSongs}
                    margin={{ top: 10, right: 20, left: 35, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="song_name"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 11 }}
                      tickFormatter={(value) => truncateLabel(value, 16)}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={30}
                    />
                    <YAxis
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 12 }}
                      label={{
                        value: "Appearances",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fill: "#fff",
                          fontSize: 14
                        }
                      }}
                    />
                    <Tooltip
                      content={<CustomTopSongsTooltip />}
                      cursor={{ fill: "#fff", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="appearances"
                      fill="#00c49f"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
