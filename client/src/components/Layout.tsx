import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand">DARB</div>
        <ul className="navbar-nav">
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/processes">Processes</Link>
          </li>
          <li>
            <Link to="/tasks">My Tasks</Link>
          </li>
          <li>
            <Link to="/work-items">Work Items</Link>
          </li>
          <li>
            <span style={{ color: '#ccc' }}>|</span>
          </li>
          <li>
            <span style={{ color: '#ccc' }}>{user?.username}</span>
          </li>
          <li>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
