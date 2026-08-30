import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Swal from 'sweetalert2';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PendingState from './pages/auth/PendingState';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTickets from './pages/admin/AdminTickets';
import UserDashboard from './pages/user/UserDashboard';
import UserDeviceManager from './pages/user/UserDeviceManager';
import UserTickets from './pages/user/UserTickets';
import Profile from './pages/common/Profile';
import DeviceConfig from './pages/device/DeviceConfig';
import LandingPage from './pages/public/LandingPage';
import NotFound from './pages/public/NotFound';

import { Home, Users, Server, LifeBuoy, User, Fish, LogOut } from 'lucide-react';

function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userRole, userStatus } = useAuth();

  if (!currentUser) {
    return <Navigate to="/landing" replace />;
  }

  if (!currentUser.emailVerified || userStatus === 'pending') {
    return <PendingState />;
  }

  if (adminOnly && userRole !== 'master_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function GlobalBottomNav() {
  const { userRole } = useAuth();
  const location = useLocation();

  let navConfig = [];

  if (userRole === 'master_admin') {
    navConfig = [
      { path: '/', label: 'Overview', icon: Home },
      { path: '/users', label: 'Users', icon: Users },
      { path: '/tickets', label: 'Tiket', icon: LifeBuoy },
      { path: '/profile', label: 'Profil', icon: User }
    ];
  } else {
    navConfig = [
      { path: '/', label: 'Monitor', icon: Home },
      { path: '/devices', label: 'Alat', icon: Server },
      { path: '/tickets', label: 'Tiket', icon: LifeBuoy },
      { path: '/profile', label: 'Profil', icon: User }
    ];
  }

  const activeIndex = navConfig.findIndex(item => item.path === location.pathname);

  return (
    <div className="smooth-bottom-nav">
      <div className="nav-bg-clipper">
        <div className="nav-bg-slider" style={{ '--active-index': activeIndex >= 0 ? activeIndex : 0 }}>
          <svg viewBox="0 0 100 70" preserveAspectRatio="none">
            <path d="M0,0 C20,0 20,45 50,45 C80,45 80,0 100,0 L100,70 L0,70 Z" fill="white" />
          </svg>
        </div>
      </div>
      <div className="nav-items">
        {navConfig.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={index} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <div className="nav-icon-frame">
                <Icon size={20} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AppLayout({ children, title }) {
  const { userRole, userData, logout } = useAuth();

  const handleHeaderLogout = async () => {
    const confirm = await Swal.fire({
      customClass: { popup: 'glass-swal', title: 'glass-swal-title', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' },
      title: 'Keluar?',
      text: 'Apakah Anda yakin ingin keluar dari aplikasi?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });
    if (confirm.isConfirmed) {
      logout();
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', boxSizing: 'border-box' }}>
      <header className="glass-header" style={{ padding: '0.75rem 4%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.35rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fish size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 800, lineHeight: 1.1 }}>{title}</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {userRole === 'master_admin' ? 'Master Admin' : (userData?.institution || 'Nila AquaSync')}
            </span>
          </div>
        </div>

        {/* Top Right Logout Button (Icon-only on mobile) */}
        <button
          onClick={handleHeaderLogout}
          className="btn-3d btn-danger"
          style={{ padding: '0.45rem 0.65rem', borderRadius: '1.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}
          title="Keluar dari Aplikasi"
        >
          <LogOut size={16} />
          <span className="hide-on-mobile">Keluar</span>
        </button>
      </header>

      <main style={{ padding: '1rem 3%', maxWidth: '800px', margin: '0 auto' }}>
        {children}
      </main>

      <GlobalBottomNav />
    </div>
  );
}

function MainApp() {
  const { userRole } = useAuth();

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout title={userRole === 'master_admin' ? 'Dashboard Admin' : 'Monitoring Air'}>
            {userRole === 'master_admin' ? <AdminDashboard view="dashboard" /> : <UserDashboard />}
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute adminOnly={true}>
          <AppLayout title="Kelola Pengguna">
            <AdminDashboard view="users" />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/devices" element={
        <ProtectedRoute>
          <AppLayout title="Kelola Perangkat">
            <UserDeviceManager />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/tickets" element={
        <ProtectedRoute>
          <AppLayout title="Pengaduan & Tiket">
            {userRole === 'master_admin' ? <AdminTickets /> : <UserTickets />}
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout title="Profil Saya">
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/device/:deviceId/config" element={
        <ProtectedRoute>
          <AppLayout title="Konfigurasi Perangkat">
            <DeviceConfig />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
