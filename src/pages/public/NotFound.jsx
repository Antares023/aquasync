import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

function NotFound() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        <AlertCircle size={56} color="var(--status-critical)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>404 - Halaman Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <Link to="/" className="btn-3d" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
