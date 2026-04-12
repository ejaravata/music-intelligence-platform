import { useEffect, useState } from "react";
import "../analytics.css";
import config from "../config.json";
import SideMenu from "../components/SideMenu.jsx";
import Header from "../components/Header.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from "recharts";

/* special tooltip for genre trend chart that sorts genres by value and
only shows genres with non-zero wins */
function CustomGenreTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const sortedPayload = [...payload]
    .filter((entry) => entry.value !== undefined && entry.value !== null)
    .sort((a, b) => b.value - a.value);

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

      {sortedPayload.map((entry) => (
        <div
          key={entry.dataKey}
          style={{
            color: entry.color,
            marginBottom: "2px"
          }}
        >
          {entry.dataKey}: {entry.value}
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
  const [genreTrendData, setGenreTrendData] = useState([]);
  const [topTrendGenres, setTopTrendGenres] = useState([]);
  const [topArtistData, setTopArtistData] = useState([]);
  const [topGenreData, setTopGenreData] = useState([]);

  // colors for genres in line chart
  const lineColors = [
    "#00bcd4",
    "#ff9800",
    "#4caf50",
    "#e91e63",
    "#9c27b0",
    "#f6e337",
    "#03a9f4",
    "#f44336",
    "#8bc34a",
    "#ffc107"
  ];

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/grammys/genres`)
      .then((res) => res.json())
      .then((data) => {
        const genreTotals = {};

        /* formats data into structure for line chart:
        we group by year and then have each genre as a separate key 
        with # of wins as respective value */
        data.forEach((row) => {
          genreTotals[row.genre] =
            (genreTotals[row.genre] || 0) + Number(row.grammy_wins);
        });

        const topGenres = Object.entries(genreTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([genre]) => genre);

        const groupedByYear = {};

        data.forEach((row) => {
          const year = Number(row.year);
          const genre = row.genre;
          const wins = Number(row.grammy_wins);

          if (!topGenres.includes(genre)) return;

          if (!groupedByYear[year]) {
            groupedByYear[year] = { year };
            topGenres.forEach((g) => {
              groupedByYear[year][g] = 0;
            });
          }

          groupedByYear[year][genre] = wins;
        });

        const formatted = Object.values(groupedByYear).sort(
          (a, b) => a.year - b.year
        );

        setTopTrendGenres(topGenres);
        setGenreTrendData(formatted);
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

  return (
    <div className="analytics-page">
      <Header
        siteName="Grammy Analytics"
        username="User"
        searchPlaceholder="Search..."
        onMenuToggle={() => setIsSideMenuOpen((open) => !open)}
        onSearch={(query) => console.log("Search query:", query)}
      />

      <div className={`analytics-layout ${isSideMenuOpen ? "" : "analytics-layout--collapsed"}`}>
        <div className={`side-menu-panel ${isSideMenuOpen ? "" : "side-menu-panel--collapsed"}`}>
          <SideMenu />
        </div>

        <main className="analytics-content">
          <div className="analytics-grid">
            <div className="analytics-card analytics-card--wide">
              <h2>Grammy Genre Popularity Over Time</h2>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={genreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="year"
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#fff"
                      tick={{ fill: "#fff", fontSize: 12 }}
                    />
                    <Tooltip content={<CustomGenreTooltip />} />
                    <Legend wrapperStyle={{ color: "#fff" }} />
                    {topTrendGenres.map((genre, index) => (
                      <Line
                        key={genre}
                        type="monotone"
                        dataKey={genre}
                        stroke={lineColors[index % lineColors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analytics-card">
              <h2>Top 10 Artists by Grammy Wins</h2>
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
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#fff", marginBottom: "4px" }}
                      itemStyle={{ color: "#fff", padding: 0 }}
                      cursor={{ fill: "white", fillOpacity: 0.4 }}
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
              <h2>Top 10 Genres by Grammy Wins</h2>
              <div className="chart-wrapper">
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
                      tick={{ fill: "#fff", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#fff", marginBottom: "4px" }}
                      itemStyle={{ color: "#fff", padding: 0 }}
                      cursor={{ fill: "white", fillOpacity: 0.4 }}
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
