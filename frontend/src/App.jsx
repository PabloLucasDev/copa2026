import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FlaskConical, LayoutDashboard, LogOut, Shield, Trophy, UserRound, Users } from 'lucide-react';
import { api, clearSession, getStoredUser, setSession } from './api.js';
import { AuthPage } from './pages/AuthPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { MatchesPage } from './pages/MatchesPage.jsx';
import { RankingPage } from './pages/RankingPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { UsersAdminPage } from './pages/UsersAdminPage.jsx';
import { TestMatchesAdminPage } from './pages/TestMatchesAdminPage.jsx';
import neymarImage from '../images/neymar.png';
import officeCopaLogo from '../images/logoOfficeCopa.png';

const tabs = [
  { id: 'matches', label: 'Jogos', icon: CalendarDays },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'profile', label: 'Perfil', icon: UserRound }
];

export function App() {
  const [user, setUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'dashboard' : 'matches');
  const [loadingSession, setLoadingSession] = useState(Boolean(user));

  useEffect(() => {
    if (!user) return;

    api('/auth/me')
      .then(({ user: freshUser }) => {
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoadingSession(false));
  }, []);

  const navTabs = useMemo(() => {
    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ...tabs,
        { id: 'admin', label: 'Resultados oficiais', icon: Shield },
        { id: 'test-matches-admin', label: 'Jogos de teste', icon: FlaskConical },
        { id: 'users-admin', label: 'Usuarios', icon: Users }
      ];
    }
    return tabs;
  }, [user]);

  function handleLogin(session) {
    setSession(session);
    setUser(session.user);
    setActiveTab(session.user?.role === 'admin' ? 'dashboard' : 'matches');
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (loadingSession) {
    return <div className="center-screen">Carregando...</div>;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" style={{ '--sidebar-player': `url(${neymarImage})` }}>
        <div>
          <div className="sidebar-logo">
            <img alt="OFFICE CONT Copa" src={officeCopaLogo} />
          </div>

          <nav className="nav-list">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button className="nav-item logout" onClick={handleLogout} type="button">
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <main className="main-content">
        <div className="content-stage">
          {activeTab === 'dashboard' && user.role === 'admin' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'matches' && <MatchesPage />}
          {activeTab === 'ranking' && <RankingPage />}
          {activeTab === 'profile' && <ProfilePage onUserUpdated={setUser} />}
          {activeTab === 'admin' && user.role === 'admin' && <AdminPage />}
          {activeTab === 'test-matches-admin' && user.role === 'admin' && <TestMatchesAdminPage />}
          {activeTab === 'users-admin' && user.role === 'admin' && <UsersAdminPage currentUser={user} />}
        </div>
        <footer className="app-footer">
          <strong>© 2026 OFFICE CONT - World Cup Corporate Edition</strong>
          <nav>
            <a href="#rules">Regras</a>
            <a href="#privacy">Privacidade</a>
            <a href="#support">Suporte</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
