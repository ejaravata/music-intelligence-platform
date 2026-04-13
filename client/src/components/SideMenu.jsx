import { NavLink } from "react-router-dom";
import './SideMenu.css'

const navItems = [
  { to: "/", label: "Home", icon: "fa-home" },
  { to: "/overview", label: "Overview", icon: "fa-chart-pie" },
  { to: "/grammy-analytics", label: "Grammy Analytics", icon: "fa-chart-line" },
  { to: "/billboard-analytics", label: "Billboard Analytics", icon: "fa-chart-bar" },
  { to: "/favorites", label: "Favorites", icon: "fa-heart" },
];

export default function SideMenu() {
  return (
    <aside className="side-menu">
      <nav className="side-menu-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `side-menu-link${isActive ? " side-menu-link--active" : ""}`
            }
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
