import { NavLink } from "react-router";

export const Home  = () => (
  <div className="home-container">
    <h2>Select a game mode:</h2>
    <nav className="home-nav">
      <NavLink to="/hiragana" className="nav-link">
        Hiragana ひらがな
      </NavLink>
      <NavLink to="/katakana" className="nav-link">
        Katakana カタカナ
      </NavLink>
    </nav>
  </div>
);