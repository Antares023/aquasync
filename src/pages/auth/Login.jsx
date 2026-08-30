import { useState } from 'react';
import { auth } from '../../firebase';
import Swal from 'sweetalert2';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Fish, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const swalConfig = {
    customClass: {
      popup: 'glass-swal',
      title: 'glass-swal-title',
      htmlContainer: 'glass-swal-content',
      confirmButton: 'glass-swal-confirm'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isResetting) {
      try {
        await resetPassword(email);
        Swal.fire({ ...swalConfig, title: 'Berhasil', text: 'Tautan pemulihan password telah dikirim ke email Anda. Silakan periksa inbox atau spam.', icon: 'success' });
      } catch (err) {
        Swal.fire({ ...swalConfig, title: 'Gagal', text: 'Pastikan email sudah terdaftar.', icon: 'error' });
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          Swal.fire({ ...swalConfig, title: 'Verifikasi Dibutuhkan', text: 'Email Anda belum diverifikasi. Lanjutkan ke halaman verifikasi.', icon: 'warning', timer: 2000, showConfirmButton: false }).then(() => { navigate('/'); });
        } else {
          const snapshot = await get(ref(database, `users/${user.uid}`));
          if (snapshot.exists() && snapshot.val().status === 'pending') {
            Swal.fire({ ...swalConfig, title: 'Menunggu Persetujuan', text: 'Akun Anda sudah diverifikasi, namun masih menunggu persetujuan Admin.', icon: 'info', timer: 2000, showConfirmButton: false }).then(() => { navigate('/'); });
          } else {
            Swal.fire({ ...swalConfig, title: 'Login Berhasil', text: 'Selamat datang kembali!', icon: 'success', timer: 1500, showConfirmButton: false }).then(() => { navigate('/'); });
          }
        }
      } catch (err) {
        Swal.fire({ ...swalConfig, title: 'Gagal Login', text: 'Periksa email dan password Anda.', icon: 'error' });
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem', boxSizing: 'border-box', width: '100%' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'rgba(12, 74, 110, 0.1)',
            width: '80px', height: '80px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.05)',
            border: '1px solid rgba(12, 74, 110, 0.3)'
          }}>
            {isResetting ? <KeyRound size={36} color="var(--primary)" /> : <Fish size={40} color="var(--primary)" />}
          </div>
          <h2 className="title-gradient">{isResetting ? 'Reset Password' : 'NILA AQUASYNC'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isResetting ? 'Masukkan email Anda untuk menerima tautan pemulihan.' : 'Masuk untuk memantau kejernihan air kolam Anda'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {!isResetting && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-3d" style={{ marginTop: '1rem', padding: '1rem' }}>
            {loading ? 'Memproses...' : (isResetting ? 'Kirim Tautan Reset' : 'Masuk')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <button onClick={() => { setIsResetting(!isResetting); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
              {isResetting ? 'Kembali ke Halaman Login' : 'Lupa Password?'}
            </button>
          </div>
          {!isResetting && (
            <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Belum punya akun?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Daftar</Link>
            </div>
          )}
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <Link to="/landing" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
