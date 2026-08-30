import { Link } from 'react-router-dom';
import { Fish, Droplets, ShieldCheck, Activity, ChevronRight, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function LandingPage() {
  const { currentUser, userStatus } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Navbar */}
      <header style={{ padding: '1rem 4%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(12, 74, 110, 0.08)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.35rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fish size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '0.5px' }}>NILA AQUASYNC</span>
        </div>

        <div>
          {currentUser && userStatus === 'approved' ? (
            <Link to="/" className="btn-3d" style={{ textDecoration: 'none', padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              Dashboard <ChevronRight size={15} />
            </Link>
          ) : (
            <Link to="/login" className="btn-3d" style={{ textDecoration: 'none', padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <LogIn size={15} /> Masuk
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '2.5rem 5% 2rem 5%', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-up">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(12, 74, 110, 0.08)', padding: '0.35rem 0.9rem', borderRadius: '2rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '1.25rem' }}>
          <Activity size={15} /> Pemantauan Kejernihan Air Kolam Real-time
        </div>
        <h1 className="title-gradient" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: '1rem' }}>
          Jaga Kualitas Air Kolam Nila Anda Secara Otomatis
        </h1>
        <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.75rem' }}>
          Sistem pemantauan sensor kekeruhan air (NTU) terintegrasi IoT dengan klasifikasi kejernihan 4 level, kontrol aktuator otomatis, dan laporan PDF resmi untuk budidaya ikan nila yang optimal.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn-3d" style={{ textDecoration: 'none', padding: '0.75rem 1.6rem', fontSize: '0.9rem' }}>
            Daftar Sekarang
          </Link>
          <Link to="/login" className="btn-3d-secondary" style={{ textDecoration: 'none', padding: '0.75rem 1.6rem', fontSize: '0.9rem' }}>
            Masuk Akun
          </Link>
        </div>
      </section>

      {/* Features Grid Carousel (Responsive Mobile Swipeable) */}
      <section style={{ padding: '1rem 0 3rem 0', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Fitur Unggulan Sistem
        </h2>

        {/* Mobile Swipe Hint */}
        <div className="hide-on-desktop" style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          &larr; Geser menyamping untuk melihat fitur &rarr;
        </div>

        <div className="features-grid">
          <div className="glass-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <div style={{ background: 'rgba(12, 74, 110, 0.08)', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem auto' }}>
              <Droplets size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Sensor NTU Real-time</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>Pantau kekeruhan air kolam secara presisi detik demi detik dari smartphone Anda.</p>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <div style={{ background: 'rgba(12, 74, 110, 0.08)', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem auto' }}>
              <Activity size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Grafik & Laporan PDF</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>Grafik riwayat historis dan unduh laporan kualitas air berbentuk dokumen PDF resmi.</p>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <div style={{ background: 'rgba(12, 74, 110, 0.08)', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem auto' }}>
              <ShieldCheck size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Keamanan Terjamin</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>Verifikasi email 24 jam & persetujuan admin memastikan hanya user sah yang terhubung.</p>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <div style={{ background: 'rgba(12, 74, 110, 0.08)', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem auto' }}>
              <Fish size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>Manajemen Kolam</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>Kelola multiple alat & lokasi kolam dalam satu dasbor terpadu.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '1.5rem 5%', textAlign: 'center', borderTop: '1px solid rgba(12, 74, 110, 0.08)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Nila AquaSync — Smart Water Quality Monitoring PWA
      </footer>
    </div>
  );
}

export default LandingPage;
