import { useEffect, useState } from "react";
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

/* custom tooltip to show genre and wins on hover for top chart */
function CustomTopChartTooltip({ active, payload, label }) {
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
        minWidth: "120px"
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
        Wins: {payload[0].value}
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

export default function GrammyAnalytics() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [genreHistoryRows, setGenreHistoryRows] = useState([]);
  const [topTrendGenres, setTopTrendGenres] = useState([]);
  const [selectedYear, setSelectedYear] = useState(1959);
  const [topArtistData, setTopArtistData] = useState([]);
  const [topGenreData, setTopGenreData] = useState([]);
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
    fetch(`http://${config.server_host}:${config.server_port}/grammys/genres`)
      .then((res) => res.json())
      .then((data) => {
        const genreTotals = {};

        /* rewrite data into more usable format and calculate total wins per genre
        for top trend calculation */
        data.forEach((row) => {
          const genre = row.genre;
          const wins = Number(row.grammy_wins);
          genreTotals[genre] = (genreTotals[genre] || 0) + wins;
        });

        const topGenres = Object.entries(genreTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([genre]) => genre);

        setTopTrendGenres(topGenres);
        setGenreHistoryRows(
          data.map((row) => ({
            year: Number(row.year),
            genre: row.genre,
            grammy_wins: Number(row.grammy_wins)
          }))
        );
      })
      .catch((err) => console.log(err));

    fetch(`http://${config.server_host}:${config.server_port}/grammys/top_winning_artists`)
      .then((res) => res.json())
      .then((data) =>
        setTopArtistData(
          data.slice(0, 10).map((row) => ({
            ...row,
            grammy_wins: Number(row.grammy_wins)
          }))
        )
      )
      .catch((err) => console.log(err));

    fetch(`http://${config.server_host}:${config.server_port}/grammys/top_winning_genres`)
      .then((res) => res.json())
      .then((data) =>
        setTopGenreData(
          data.slice(0, 10).map((row) => ({
            ...row,
            grammy_wins: Number(row.grammy_wins)
          }))
        )
      )
      .catch((err) => console.log(err));
  }, []);

  const tooltipStyle = {
    backgroundColor: "#000",
    border: "1px solid #fff",
    borderRadius: "6px",
    padding: "6px 8px",
    fontSize: "12px"
  };

  /* color map to assign consistent colors to genres in top trend chart, 
  even if they move */
  const genreColorMap = Object.fromEntries(
    topTrendGenres.map((genre, index) => [
      genre,
      genreColors[index % genreColors.length]
    ])
  );
  const cumulativeGenreData = topTrendGenres
    .map((genre) => {
      const cumulativeWins = genreHistoryRows
        .filter((row) => row.genre === genre && row.year <= selectedYear)
        .reduce((sum, row) => sum + row.grammy_wins, 0);

      return {
        genre,
        wins: cumulativeWins,
        fill: genreColorMap[genre]
      };
    })
    .sort((a, b) => b.wins - a.wins);

  return (
    <div className="analytics-page">
      <Header
        siteName="Grammy Analytics"
        username={userName}
        onLogout={logout}
        onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
        showSearch={false}
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
              <h2>
                Genre Popularity Over Time (Total Wins From 1959 - {selectedYear})
              </h2>
              <p className="analytics-card-note">
                Note: wins only accounts for artist, song, and album awards. 
                No miscellaneous awards are included, such as "Best Performance" or "Best Music Video".
              </p>

              <div className="year-slider-wrapper">
                <input
                  type="range"
                  min="1959"
                  max="2024"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="year-slider"
                />
                <div className="year-slider-label">{selectedYear}</div>
              </div>

              <div className="analytics-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cumulativeGenreData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      type="number"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 12 }}
                      tickFormatter={(tick) => Math.floor(tick)}
                      allowDecimals={false}
                      label={{
                        value: "Wins",
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
                      width={90}
                    />
                    <Tooltip
                      content={<CustomTopChartTooltip />} 
                      cursor={{ fill: "#fff", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="wins"
                      shape={<GenreBarShape />}
                      isAnimationActive={true}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h2>Top 10 Artists by Grammy Wins</h2>
              <p className="analytics-card-note">
                Note: wins only accounts for artist, song, and album awards. 
                No miscellaneous awards are included, such as "Best Performance" or "Best Music Video".
              </p>
              <div className="analytics-chart-wrapper">
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
                        value: "Wins",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: 'middle',fill: "#fff", fontSize: 14 }
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#fff", marginBottom: "4px" }}
                      itemStyle={{ color: "#fff", padding: 0 }}
                      cursor={{ fill: "#fff", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="grammy_wins"
                      fill="#1e90ff"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h2>Top 10 Genres by Average Grammy Wins</h2>
              <p className="analytics-card-note">
                Note: wins only accounts for artist, song, and album awards. 
                No miscellaneous awards are included, such as "Best Performance" or "Best Music Video".
              </p>
              <div className="analytics-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topGenreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="genre"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 11 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      height={60}
                    />
                    <YAxis
                      stroke="#fff"
                      domain={[0, 6]}
                      tick={{ fill: "#fff", fontSize: 12 }}
                      label={{
                        value: "Average Wins",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: 'middle',fill: "#fff", fontSize: 14 }
                      }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#fff", marginBottom: "4px" }}
                      itemStyle={{ color: "#fff", padding: 0 }}
                      cursor={{ fill: "#fff", fillOpacity: 0.4 }}
                    />
                    <Bar
                      dataKey="grammy_wins"
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
