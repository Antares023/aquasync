import { useState } from 'react';
import { auth, database } from '../../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import Swal from 'sweetalert2';
import { ref, set } from 'firebase/database';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await set(ref(database, `users/${user.uid}`), {
        email: user.email,
        name: name,
        phone: phone,
        institution: location,
        role: 'user',
        status: 'pending',
        created_at: Date.now(),
        email_verified: false
      });

      Swal.fire({ ...swalConfig, title: 'Pendaftaran Berhasil!', text: 'Silakan cek email Anda untuk verifikasi. Akun Anda sedang menunggu persetujuan admin.', icon: 'success' }).then(() => { navigate('/'); });
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Gagal Mendaftar', text: err.message, icon: 'error' });
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
            <UserPlus size={40} color="var(--primary)" />
          </div>
          <h2 className="title-gradient">Buat Akun</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bergabung untuk memonitor kejernihan air kolam</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nama Lengkap</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>No. WhatsApp</label>
            <input type="tel" required maxLength="13" value={phone} onChange={(e) => { const onlyNums = e.target.value.replace(/\D/g, ''); setPhone(onlyNums); }} placeholder="Contoh: 08123456789" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Lokasi Kolam</label>
            <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Kolam Nila Blok A" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-3d" style={{ marginTop: '1rem', padding: '1rem' }}>
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Masuk</Link>
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/landing" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
