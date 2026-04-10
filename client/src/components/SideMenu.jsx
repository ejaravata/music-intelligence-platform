import { NavLink } from "react-router-dom";
import './SideMenu.css'

const navItems = [
  { to: "/", label: "Home" },
  { to: "/analytics", label: "Analytics" },
  { to: "/favorites", label: "Favorites" },
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}