import { useState, useEffect } from 'react';
import { ref, onValue, set, remove, get, child } from 'firebase/database';
import { database } from '../../firebase';
import Swal from 'sweetalert2';
import { Users, Server, Clock, ChevronDown, ChevronUp, Droplets, Thermometer, FlaskConical, Phone, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard({ view = 'dashboard' }) {
  const [users, setUsers] = useState({});
  const [devices, setDevices] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedUsers, setExpandedUsers] = useState({});
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', institution: '' });
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => { setUsers(snapshot.exists() ? snapshot.val() : {}); });
    const devicesRef = ref(database, 'devices');
    const unsubDevices = onValue(devicesRef, (snapshot) => { setDevices(snapshot.exists() ? snapshot.val() : {}); });
    return () => { unsubUsers(); unsubDevices(); };
  }, []);

  // Auto-Cleanup Spam Accounts (> 24 hours unverified)
  useEffect(() => {
    if (Object.keys(users).length === 0) return;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    Object.entries(users).forEach(([uid, user]) => {
      if (user.status === 'pending' && user.email_verified === false && user.created_at) {
        if (now - user.created_at > ONE_DAY) {
          remove(ref(database, `users/${uid}`)).catch(err => console.error("Auto-clean error:", err));
        }
      }
    });
  }, [users]);

  const getDevicesByUser = (uid) => Object.entries(devices).filter(([_, data]) => data.owner_uid === uid);
  const toggleExpandUser = (uid) => setExpandedUsers(prev => ({ ...prev, [uid]: !prev[uid] }));

  const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', htmlContainer: 'glass-swal-content', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' } };

  const handleApprove = async (uid, userName) => {
    const confirm = await Swal.fire({ ...swalConfig, title: 'Setujui Pengguna?', text: `Apakah Anda yakin ingin menyetujui akun ${userName}?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Setujui', cancelButtonText: 'Batal', reverseButtons: true });
    if (!confirm.isConfirmed) return;
    try {
      await set(ref(database, `users/${uid}/status`), 'approved');
      Swal.fire({ ...swalConfig, title: 'Disetujui!', text: 'Akun pengguna telah disetujui.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire({ ...swalConfig, title: 'Gagal', text: error.message, icon: 'error' }); }
  };

  const handleReject = async (uid, userName) => {
    const confirm = await Swal.fire({ ...swalConfig, title: 'Tolak & Hapus?', text: `Apakah Anda yakin ingin menolak dan menghapus akun ${userName} permanen?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Tolak & Hapus', cancelButtonText: 'Batal', reverseButtons: true });
    if (!confirm.isConfirmed) return;
    try {
      const userDevices = getDevicesByUser(uid);
      for (const [deviceId] of userDevices) { await remove(ref(database, `devices/${deviceId}`)); }
      await remove(ref(database, `users/${uid}`));
      Swal.fire({ ...swalConfig, title: 'Terhapus!', text: 'Akun pendaftar beserta perangkatnya telah ditolak dan dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire({ ...swalConfig, title: 'Gagal', text: error.message, icon: 'error' }); }
  };

  const startEditUser = (uid, user) => { setEditingUserId(uid); setEditFormData({ name: user.name || '', phone: user.phone || '', institution: user.institution || '' }); };
  const cancelEditUser = () => setEditingUserId(null);

  const handleUpdateUser = async (e, uid) => {
    e.preventDefault();
    try {
      await set(ref(database, `users/${uid}/name`), editFormData.name);
      await set(ref(database, `users/${uid}/phone`), editFormData.phone);
      await set(ref(database, `users/${uid}/institution`), editFormData.institution);
      Swal.fire({ ...swalConfig, title: 'Berhasil', text: 'Data pengguna berhasil diperbarui.', icon: 'success', timer: 1500, showConfirmButton: false });
      setEditingUserId(null);
    } catch (error) { Swal.fire({ ...swalConfig, title: 'Gagal', text: error.message, icon: 'error' }); }
  };

  const handleDeleteUser = async (uid, userName) => {
    const confirm = await Swal.fire({ ...swalConfig, title: 'Hapus Permanen?', text: `Apakah Anda yakin ingin menghapus akun ${userName} beserta semua perangkat miliknya?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', reverseButtons: true });
    if (confirm.isConfirmed) {
      try {
        const userDevices = getDevicesByUser(uid);
        for (const [deviceId] of userDevices) { await remove(ref(database, `devices/${deviceId}`)); }
        await remove(ref(database, `users/${uid}`));
        Swal.fire({ ...swalConfig, title: 'Terhapus!', text: 'Akun beserta perangkatnya berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (error) { Swal.fire({ ...swalConfig, title: 'Gagal', text: error.message, icon: 'error' }); }
    }
  };

  const handleDeleteDeviceAdmin = async (deviceId, deviceName) => {
    const confirm = await Swal.fire({ ...swalConfig, title: 'Hapus Paksa Perangkat?', text: `Yakin ingin mencabut perangkat "${deviceName}" secara paksa?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', reverseButtons: true });
    if (confirm.isConfirmed) {
      try { await remove(ref(database, `devices/${deviceId}`)); Swal.fire({ ...swalConfig, title: 'Terhapus!', text: 'Perangkat berhasil dihapus.', icon: 'success', timer: 1500, showConfirmButton: false }); }
      catch (error) { Swal.fire({ ...swalConfig, title: 'Gagal', text: error.message, icon: 'error' }); }
    }
  };

  const handleEditDeviceAdmin = async (e, oldDeviceId, currentName) => {
    e.stopPropagation();
    const { value: formValues } = await Swal.fire({
      ...swalConfig, title: 'Ubah Data Alat',
      html: `<div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;"><div><label style="font-size: 0.8rem; color: var(--text-muted);">ID Alat Baru</label><input id="swal-dev-id" class="swal2-input" style="margin: 0; width: 100%;" value="${oldDeviceId}"></div><div><label style="font-size: 0.8rem; color: var(--text-muted);">Nama Alat</label><input id="swal-dev-name" class="swal2-input" style="margin: 0; width: 100%;" value="${currentName || ''}"></div></div>`,
      focusConfirm: false, showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal',
      preConfirm: () => ({ newId: document.getElementById('swal-dev-id').value, newName: document.getElementById('swal-dev-name').value })
    });
    if (formValues) {
      const { newId, newName } = formValues;
      if (!newId || !newName) { Swal.fire({ ...swalConfig, title: 'Gagal', text: 'ID dan Nama Alat tidak boleh kosong!', icon: 'error' }); return; }
      try {
        if (newId !== oldDeviceId) {
          const snapshot = await get(child(ref(database), `devices/${newId}/owner_uid`));
          if (snapshot.exists()) { Swal.fire({ ...swalConfig, title: 'Gagal', text: 'ID Alat tersebut sudah terpakai!', icon: 'error' }); return; }
          const oldSnapshot = await get(ref(database, `devices/${oldDeviceId}`));
          if (oldSnapshot.exists()) { const data = oldSnapshot.val(); data.name = newName; await set(ref(database, `devices/${newId}`), data); await remove(ref(database, `devices/${oldDeviceId}`)); }
        } else if (newName !== currentName) { await set(ref(database, `devices/${oldDeviceId}/name`), newName); }
        Swal.fire({ ...swalConfig, title: 'Berhasil!', text: 'Data alat berhasil diubah.', icon: 'success' });
      } catch (error) { Swal.fire({ ...swalConfig, title: 'Gagal!', text: error.message, icon: 'error' }); }
    }
  };

  const pendingUsersList = Object.entries(users).filter(([_, user]) => user.status === 'pending' && user.role !== 'master_admin' && user.email_verified === true);
  const activeUsersList = Object.entries(users).filter(([_, user]) => user.status === 'approved' && user.role !== 'master_admin');
  const totalPending = pendingUsersList.length;
  const totalActiveUsers = activeUsersList.length;
  const totalDevices = Object.keys(devices).length;

  return (
    <div className="admin-dashboard" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {view === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card-concave" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
            <Users size={28} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{totalActiveUsers}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>User Aktif</div>
          </div>
          <div className="glass-card-concave" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
            <Clock size={28} color="var(--status-warning)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-warning)' }}>{totalPending}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Antrean User</div>
          </div>
          <div className="glass-card-concave" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(12, 74, 110, 0.1)', padding: '0.8rem', borderRadius: '50%' }}><Server size={32} color="var(--primary)" /></div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Alat Beroperasi</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{totalDevices} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>Unit ESP32</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'users' && (
        <>
          <div className="pill-tab-container">
            <div className="pill-tab-scroll-area">
              <button onClick={() => setActiveTab('overview')} className={`pill-tab ${activeTab === 'overview' ? 'active' : ''}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Active Users</button>
              <button onClick={() => setActiveTab('pending')} className={`pill-tab ${activeTab === 'pending' ? 'active' : ''}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                Pending
                {totalPending > 0 && (<span style={{ background: 'var(--status-critical)', color: 'white', borderRadius: '1rem', padding: '0 0.4rem', height: '1.2rem', minWidth: '1.2rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{totalPending}</span>)}
              </button>
            </div>
          </div>

          {activeTab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingUsersList.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>Tidak ada antrean pendaftaran.</div>
              ) : (
                pendingUsersList.map(([uid, user]) => (
                  <div key={uid} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' }}>Menunggu Persetujuan</div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{user.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.2rem 0 0 0', wordBreak: 'break-all' }}>{user.email}</p>
                        {user.phone && (<p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {user.phone}</p>)}
                        {user.created_at && (<p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> Terdaftar: {new Date(user.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>)}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <button onClick={() => handleApprove(uid, user.name)} className="btn-3d" style={{ width: '100%' }}>Setujui</button>
                      <button onClick={() => handleReject(uid, user.name)} className="btn-3d btn-danger" style={{ width: '100%' }}>Tolak</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeUsersList.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>Belum ada user yang disetujui.</div>
              ) : (
                activeUsersList.map(([uid, user]) => {
                  const userDevices = getDevicesByUser(uid);
                  const isExpanded = !!expandedUsers[uid];
                  return (
                    <div key={uid} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div onClick={() => toggleExpandUser(uid)} style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.name}</h3><p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{user.institution || '-'}</p></div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                      {isExpanded && (
                        <div style={{ background: 'rgba(12, 74, 110, 0.02)', padding: '1.5rem', borderTop: '1px solid rgba(12, 74, 110, 0.1)' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(12, 74, 110, 0.05)', paddingBottom: '1rem' }}>
                            <button onClick={() => startEditUser(uid, user)} className="btn-3d-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Edit Pengguna</button>
                            <button onClick={() => handleDeleteUser(uid, user.name)} className="btn-3d btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Hapus Pengguna</button>
                          </div>
                          {editingUserId === uid && (
                            <form onSubmit={(e) => handleUpdateUser(e, uid)} className="glass-panel" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
                              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '0.9rem' }}>Edit Data Pengguna</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Nama Lengkap</label><input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} required style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box' }} /></div>
                                <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>No WhatsApp</label><input type="text" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} required style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box' }} /></div>
                                <div><label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Lokasi Kolam</label><input type="text" value={editFormData.institution} onChange={e => setEditFormData({...editFormData, institution: e.target.value})} required style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box' }} /></div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}><button type="submit" className="btn-3d" style={{ flex: 1, padding: '0.6rem' }}>Simpan</button><button type="button" onClick={cancelEditUser} className="btn-3d-secondary" style={{ flex: 1, padding: '0.6rem' }}>Batal</button></div>
                              </div>
                            </form>
                          )}
                          {userDevices.length === 0 ? (<p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada alat.</p>) : (
                            userDevices.map(([deviceId, devData]) => {
                              const lastUpdated = devData.last_updated || 0;
                              const lastUpdatedMs = lastUpdated < 10000000000 ? lastUpdated * 1000 : lastUpdated;
                              const isOnline = (currentTime - lastUpdatedMs) <= 60000 && lastUpdated > 0;
                              const sensors = devData.sensor_data || {};
                              const ntu = sensors.ntu || sensors.turbidity || 0;
                              return (
                                <div key={deviceId} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <Server size={18} color="var(--primary)" />
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{devData.name || 'Alat Tanpa Nama'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {deviceId}</div>
                                      </div>
                                    </div>
                                    {isOnline ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div> Online</div>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div> Offline</div>
                                    )}
                                  </div>
                                  <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ background: 'rgba(12, 74, 110, 0.04)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}><Droplets size={14} color="var(--primary)" /><span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Kekeruhan Air (NTU)</span></div>
                                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{ntu.toFixed(1)} NTU</div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={(e) => handleEditDeviceAdmin(e, deviceId, devData.name)} className="btn-3d" style={{ padding: '0.6rem 0.8rem', fontSize: '0.8rem' }} title="Edit Alat"><Edit2 size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeviceAdmin(deviceId, devData.name); }} className="btn-3d btn-danger" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}>Hapus</button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
