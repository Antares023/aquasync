import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebase';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ArrowLeft, Save, SlidersHorizontal, Settings as SettingsIcon, Power, Droplets, Wifi, Beaker } from 'lucide-react';

function DeviceConfig() {
  const { deviceId } = useParams();
  const [settings, setSettings] = useState({
    threshold_jernih: 25,
    threshold_agak_keruh: 45,
    threshold_keruh: 65,
    threshold_sangat_keruh: 85,
    pac_dosing_duration: 5
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('kontrol');
  const [controls, setControls] = useState(null);

  useEffect(() => {
    if (!deviceId) return;

    const settingsRef = ref(database, `devices/${deviceId}/settings`);
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(prev => ({ ...prev, ...snapshot.val() }));
      }
    });

    const controlsRef = ref(database, `devices/${deviceId}/controls`);
    const unsubControls = onValue(controlsRef, (snapshot) => {
      if (snapshot.exists()) {
        setControls(snapshot.val());
      }
    });

    return () => {
      unsubSettings();
      unsubControls();
    };
  }, [deviceId]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' } };

    const confirm = await Swal.fire({
      ...swalConfig,
      title: 'Simpan Ambang Batas?',
      text: 'Apakah Anda yakin ingin mengubah ambang batas kekeruhan air (NTU) & durasi dosing PAC?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await set(ref(database, `devices/${deviceId}/settings`), {
        threshold_jernih: Number(settings.threshold_jernih || 25),
        threshold_agak_keruh: Number(settings.threshold_agak_keruh || 45),
        threshold_keruh: Number(settings.threshold_keruh || 65),
        threshold_sangat_keruh: Number(settings.threshold_sangat_keruh || 85),
        pac_dosing_duration: Number(settings.pac_dosing_duration || 5)
      });
      Swal.fire({ ...swalConfig, title: 'Tersimpan!', text: 'Konfigurasi ambang batas & dosing PAC berhasil diperbarui.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Gagal', text: err.message, icon: 'error' });
    }
    setLoading(false);
  };

  const toggleMode = async (mode) => {
    try {
      await set(ref(database, `devices/${deviceId}/controls/mode`), mode);
    } catch (err) {
      console.error("Gagal mengubah mode:", err);
    }
  };

  const toggleControlField = async (field) => {
    if (!controls) return;
    const newValue = !controls[field];
    try {
      await set(ref(database, `devices/${deviceId}/controls/${field}`), newValue);
    } catch (err) {
      console.error("Gagal merubah status aktuator:", err);
    }
  };

  const handleResetWifi = async () => {
    const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' } };
    const confirm = await Swal.fire({
      ...swalConfig,
      title: 'Reset Jaringan WiFi?',
      text: 'Alat akan terputus dari jaringan dan memancarkan WiFi AP "AquaSync-Config".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (confirm.isConfirmed) {
      try {
        await set(ref(database, `devices/${deviceId}/controls/reset_wifi`), true);
        Swal.fire({
          ...swalConfig,
          title: 'Perintah Dikirim!',
          html: '<div style="text-align: left; font-size: 0.9rem;">1. Tunggu 10 detik agar alat restart.<br/><br/>2. Hubungkan HP Anda ke WiFi <b>AquaSync-Config</b>.<br/><br/>3. Buka <b>192.168.4.1</b> di browser.</div>',
          icon: 'info',
          confirmButtonText: 'Mengerti'
        });
      } catch (err) {
        Swal.fire({ ...swalConfig, title: 'Gagal', text: err.message, icon: 'error' });
      }
    }
  };

  return (
    <div className="device-config">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Link to="/devices" className="btn-3d" style={{ width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none', padding: 0 }} title="Kembali">
            <ArrowLeft size={18} color="#ffffff" />
          </Link>
          <div className="glass-card-concave" style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', height: '42px', borderRadius: '2rem', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ID: {deviceId}</span>
          </div>
        </div>
      </div>

      <div className="glass-card-concave" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.4rem', borderRadius: '16px' }}>
        <button
          onClick={() => setActiveTab('kontrol')}
          className={activeTab === 'kontrol' ? 'btn-3d' : ''}
          style={{ padding: '0.8rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', color: activeTab === 'kontrol' ? 'white' : 'var(--text-main)', background: activeTab === 'kontrol' ? 'var(--primary)' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
        >
          <SlidersHorizontal size={16} /> Kontrol Dosing PAC
        </button>
        <button
          onClick={() => setActiveTab('konfigurasi')}
          className={activeTab === 'konfigurasi' ? 'btn-3d' : ''}
          style={{ padding: '0.8rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', borderRadius: 'var(--radius-sm)', color: activeTab === 'konfigurasi' ? 'white' : 'var(--text-main)', background: activeTab === 'konfigurasi' ? 'var(--primary)' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
        >
          <SettingsIcon size={16} /> Ambang Batas & Durasi
        </button>
      </div>

      {activeTab === 'kontrol' && controls && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.75rem' }}>
            <h3 className="title-gradient" style={{ fontSize: '1.2rem', margin: 0 }}>Mode Operasional Alat</h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => toggleMode('auto')}
                className={controls.mode === 'auto' ? 'btn-3d' : 'btn-3d-secondary'}
                style={{ padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem' }}
              >
                Otomatis
              </button>
              <button
                onClick={() => toggleMode('manual')}
                className={controls.mode === 'manual' ? 'btn-3d btn-danger' : 'btn-3d-secondary'}
                style={{ padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem' }}
              >
                Manual
              </button>
            </div>
          </div>

          {controls.mode === 'auto' ? (
            <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)', background: 'rgba(12, 74, 110, 0.04)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong>Mode Otomatis Aktif.</strong> Pompa dosing PAC akan menyuntikkan cairan penjernih air secara otomatis jika kekeruhan air (NTU) melampaui ambang batas.
              </p>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', borderLeft: '4px solid #eab308', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Peringatan Mode Manual:</strong> Anda dapat menyalakan/mematikan pompa penambahan cairan penjernih PAC secara langsung.
              </div>

              {/* Single Control: Pompa Dosing PAC */}
              <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ background: 'rgba(12, 74, 110, 0.1)', padding: '0.6rem', borderRadius: '50%' }}>
                    <Beaker size={24} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pompa Dosing PAC</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Memasukkan cairan penjernih air (Poly Aluminium Chloride)</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleControlField('pump_pac')}
                  className={controls.pump_pac ? 'btn-3d-toggle-on' : 'btn-3d-toggle-off'}
                >
                  <Power size={16} /> {controls.pump_pac ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'konfigurasi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Droplets size={20} color="var(--primary)" /> Ambang Batas Klasifikasi Kekeruhan Air (NTU)
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tentukan nilai ambang batas NTU untuk menentukan 4 tingkat klasifikasi kejernihan air:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#10b981', marginBottom: '0.5rem', fontWeight: 700 }}>
                    🟢 Jernih (≤ NTU)
                  </label>
                  <input
                    type="number" step="1"
                    value={settings.threshold_jernih}
                    onChange={(e) => setSettings({ ...settings, threshold_jernih: e.target.value })}
                    placeholder="25"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Default: 25 NTU</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#0C4A6E', marginBottom: '0.5rem', fontWeight: 700 }}>
                    🔵 Agak Keruh (≤ NTU)
                  </label>
                  <input
                    type="number" step="1"
                    value={settings.threshold_agak_keruh}
                    onChange={(e) => setSettings({ ...settings, threshold_agak_keruh: e.target.value })}
                    placeholder="45"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Default: 45 NTU</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.5rem', fontWeight: 700 }}>
                    🟡 Keruh (≤ NTU)
                  </label>
                  <input
                    type="number" step="1"
                    value={settings.threshold_keruh}
                    onChange={(e) => setSettings({ ...settings, threshold_keruh: e.target.value })}
                    placeholder="65"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Default: 65 NTU</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.5rem', fontWeight: 700 }}>
                    🔴 Sangat Keruh (≥ NTU)
                  </label>
                  <input
                    type="number" step="1"
                    value={settings.threshold_sangat_keruh}
                    onChange={(e) => setSettings({ ...settings, threshold_sangat_keruh: e.target.value })}
                    placeholder="85"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Default: 85 NTU</div>
                </div>
              </div>

              {/* Durasi Dosing PAC */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Beaker size={16} color="var(--primary)" /> Durasi Dosing Cairan PAC (Detik)
                </h4>
                <input
                  type="number" min="1" max="60"
                  value={settings.pac_dosing_duration}
                  onChange={(e) => setSettings({ ...settings, pac_dosing_duration: e.target.value })}
                  placeholder="misal: 5"
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Lama pompa PAC menyala setiap kali melakukan penambahan cairan penjernih.</div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-3d" style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Ambang Batas & Durasi'}
            </button>
          </form>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wifi size={20} color="var(--primary)" /> Pengaturan Jaringan WiFi
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Reset koneksi WiFi alat untuk menghubungkannya ke jaringan hotspot baru.
            </p>
            <button
              onClick={handleResetWifi}
              type="button"
              className="btn-3d btn-danger"
              style={{ width: '100%', padding: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <Power size={16} /> Reset WiFi Alat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceConfig;
