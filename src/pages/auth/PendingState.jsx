import { LogOut, MailQuestion, ShieldAlert, Timer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { useState, useEffect } from 'react';

function PendingState() {
  const { currentUser, logout, userStatus } = useAuth();
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (currentUser && !currentUser.emailVerified && currentUser.metadata?.creationTime) {
      const creationTime = new Date(currentUser.metadata.creationTime).getTime();
      const expiresAt = creationTime + 24 * 60 * 60 * 1000;

      const timer = setInterval(() => {
        const now = Date.now();
        const distance = expiresAt - now;

        if (distance <= 0) {
          clearInterval(timer);
          setTimeLeft('EXPIRED');
        } else {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      customClass: { popup: 'glass-swal', title: 'glass-swal-title', htmlContainer: 'glass-swal-content', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' },
      title: 'Keluar?', text: 'Apakah Anda yakin ingin keluar dari aplikasi?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Keluar', cancelButtonText: 'Batal', reverseButtons: true
    });
    if (confirm.isConfirmed) { logout(); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-gradient)', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px', textAlign: 'center', padding: '2.5rem 2rem' }}>

        {!currentUser?.emailVerified ? (
          <>
            <MailQuestion size={56} color="var(--status-warning)" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Verifikasi Email Dibutuhkan</h2>

            {timeLeft === 'EXPIRED' ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Waktu Verifikasi Habis</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Pendaftaran ini sudah tidak berlaku dan akan dihapus otomatis dari sistem. Silakan mendaftar ulang.</p>
              </div>
            ) : (
              <>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--status-warning)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Timer size={16} /> Batas Waktu Verifikasi:
                  </p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--status-warning)', margin: '0.5rem 0 0 0', fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {timeLeft || "--:--:--"}
                  </p>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Kami telah mengirimkan link verifikasi ke email <strong>{currentUser?.email}</strong>.
                  Silakan periksa kotak masuk (atau folder spam) dan klik link tersebut sebelum waktu habis.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  *Setelah melakukan verifikasi email, silakan muat ulang (refresh) halaman ini.
                </p>
              </>
            )}
          </>
        ) : userStatus === 'pending' ? (
          <>
            <ShieldAlert size={56} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Menunggu Persetujuan</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Akun Anda telah berhasil diverifikasi, namun masih menunggu persetujuan dari <strong>Master Admin</strong>.
              Anda belum dapat mengakses monitoring kolam.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Silakan hubungi administrator untuk menyetujui akun Anda.
            </p>
          </>
        ) : null}

        <button
          onClick={handleLogout}
          style={{ background: 'var(--surface)', color: 'var(--status-critical)', border: '1px solid var(--status-critical)', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto', transition: 'var(--transition)' }}
        >
          <LogOut size={18} /> Keluar (Logout)
        </button>
      </div>
    </div>
  );
}

export default PendingState;
