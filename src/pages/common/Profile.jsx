import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Lock, Save, Edit3, User, Mail, Phone, MapPin } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase';
import Swal from 'sweetalert2';

function Profile() {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Edit Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      get(ref(database, `users/${currentUser.uid}`)).then((snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setUserData(val);
          setEditPhone(val.phone || '');
          setEditLocation(val.institution || '');
        }
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    const swalConfig = {
      customClass: { popup: 'glass-swal', title: 'glass-swal-title', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' }
    };

    setLoadingProfile(true);
    try {
      await update(ref(database, `users/${currentUser.uid}`), {
        phone: editPhone,
        institution: editLocation
      });

      setUserData(prev => ({
        ...prev,
        phone: editPhone,
        institution: editLocation
      }));

      setIsEditingProfile(false);
      Swal.fire({
        ...swalConfig,
        title: 'Profil Diperbarui!',
        text: 'No. WhatsApp & Lokasi Kolam berhasil disimpan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Gagal', text: err.message, icon: 'error' });
    }
    setLoadingProfile(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' } };

    if (newPassword !== confirmPassword) {
      Swal.fire({ ...swalConfig, title: 'Gagal', text: 'Password tidak cocok.', icon: 'error' });
      return;
    }

    const confirm = await Swal.fire({
      ...swalConfig,
      title: 'Ubah Password?',
      text: 'Anda yakin ingin mengubah password akun ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoadingPass(true);
      await updatePassword(currentUser, newPassword);
      Swal.fire({ ...swalConfig, title: 'Berhasil!', text: 'Password berhasil diperbarui!', icon: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        Swal.fire({ ...swalConfig, title: 'Gagal', text: 'Silakan Logout dan Login kembali untuk mengubah password.', icon: 'error' });
      } else {
        Swal.fire({ ...swalConfig, title: 'Gagal', text: error.message, icon: 'error' });
      }
    } finally {
      setLoadingPass(false);
    }
  };

  const handleLogout = async () => {
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
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Informasi Akun / Form Edit Profil */}
      <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Informasi Profil Saya</h3>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="btn-3d-secondary"
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Edit3 size={14} /> Edit Profil
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nama Lengkap</label>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{userData?.name || currentUser?.displayName || '-'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</label>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>{currentUser?.email}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No. WhatsApp</label>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userData?.phone || '-'}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lokasi Kolam</label>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userData?.institution || '-'}</div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Nama Lengkap - READ ONLY */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span>Nama Lengkap</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>🔒 Tidak dapat diubah</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={userData?.name || currentUser?.displayName || ''}
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              />
            </div>

            {/* Email - READ ONLY */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span>Email</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>🔒 Tidak dapat diubah</span>
              </label>
              <input
                type="email"
                disabled
                readOnly
                value={currentUser?.email || ''}
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              />
            </div>

            {/* No. WhatsApp - EDITABLE */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                No. WhatsApp (Dapat diubah)
              </label>
              <input
                type="tel"
                required
                maxLength="13"
                value={editPhone}
                onChange={(e) => { const onlyNums = e.target.value.replace(/\D/g, ''); setEditPhone(onlyNums); }}
                placeholder="Contoh: 08123456789"
              />
            </div>

            {/* Lokasi Kolam - EDITABLE */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Lokasi Kolam (Dapat diubah)
              </label>
              <input
                type="text"
                required
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Contoh: Kolam Nila Blok A"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="btn-3d-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingProfile}
                className="btn-3d"
                style={{ flex: 1.5, padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <Save size={14} /> {loadingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Ubah Password */}
      <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={16}/> Ubah Password
        </h3>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="btn-3d-secondary"
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem' }}
          >
            Ubah Password
          </button>
        ) : (
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Password Baru</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength="6"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Konfirmasi Password Baru</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                minLength="6"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.3rem' }}>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="btn-3d-secondary"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingPass}
                className="btn-3d"
                style={{ flex: 1.5, padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
              >
                <Save size={14}/> {loadingPass ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tombol Logout Utama */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button
          onClick={handleLogout}
          className="btn-3d btn-danger"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
        >
          <LogOut size={16} /> Keluar (Logout)
        </button>
      </div>
    </div>
  );
}

export default Profile;
