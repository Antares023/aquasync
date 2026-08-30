import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Droplets, Server, AlertTriangle,
  LayoutDashboard, Activity, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

const PdfIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <text x="5" y="17" fontSize="7" fontWeight="bold" stroke="none" fill={color} fontFamily="sans-serif">PDF</text>
  </svg>
);

function UserDashboard() {
  const { currentUser, userData } = useAuth();
  const [devices, setDevices] = useState({});
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [controls, setControls] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Fetch User Devices
  useEffect(() => {
    if (!currentUser) return;
    const devicesRef = query(ref(database, 'devices'), orderByChild('owner_uid'), equalTo(currentUser.uid));
    const unsubDevices = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const own = snapshot.val();
        setDevices(own);
        if (!selectedDeviceId && Object.keys(own).length > 0) {
          setSelectedDeviceId(Object.keys(own)[0]);
        }
      } else {
        setDevices({});
      }
    });

    return () => unsubDevices();
  }, [currentUser, selectedDeviceId]);

  // Fetch Realtime Sensor, Controls & History for Selected Device
  useEffect(() => {
    if (!selectedDeviceId) return;

    const dataRef = ref(database, `devices/${selectedDeviceId}/sensor_data`);
    const unsubData = onValue(dataRef, (snapshot) => {
      setData(snapshot.exists() ? snapshot.val() : null);
    });

    const settingsRef = ref(database, `devices/${selectedDeviceId}/settings`);
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.val());
    });

    const controlsRef = ref(database, `devices/${selectedDeviceId}/controls`);
    const unsubControls = onValue(controlsRef, (snapshot) => {
      if (snapshot.exists()) setControls(snapshot.val());
    });

    const historyRef = ref(database, `devices/${selectedDeviceId}/history`);
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const histObj = snapshot.val();
        const histArray = Object.values(histObj)
          .filter(item => item !== null && item.timestamp)
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(item => {
            const date = new Date(item.timestamp);
            return {
              ...item,
              time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
              fullDate: date.toLocaleString('id-ID')
            };
          });
        setHistoryData(histArray);
      } else {
        setHistoryData([]);
      }
    });

    return () => {
      unsubData();
      unsubSettings();
      unsubControls();
      unsubHistory();
    };
  }, [selectedDeviceId]);

  // Klasifikasi 4 Tingkat Kejernihan Air NTU
  const getFuzzyNtuInfo = (ntuValue) => {
    const val = ntuValue ?? 0;
    const tJernih = settings?.threshold_jernih ?? 25;
    const tAgakKeruh = settings?.threshold_agak_keruh ?? 45;
    const tKeruh = settings?.threshold_keruh ?? 65;

    if (val <= tJernih) {
      return {
        label: 'Jernih',
        badgeColor: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        desc: `Kondisi air jernih & ideal (≤ ${tJernih} NTU). Sangat bagus untuk budidaya ikan nila.`,
        icon: CheckCircle2
      };
    } else if (val <= tAgakKeruh) {
      return {
        label: 'Agak Keruh',
        badgeColor: '#0C4A6E',
        bg: 'rgba(12, 74, 110, 0.1)',
        desc: `Kekeruhan ringan (${tJernih + 1} - ${tAgakKeruh} NTU). Kualitas air masih dalam batas aman.`,
        icon: Activity
      };
    } else if (val <= tKeruh) {
      return {
        label: 'Keruh',
        badgeColor: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
        desc: `Air keruh (${tAgakKeruh + 1} - ${tKeruh} NTU). Disarankan menyalakan pompa filter sirkulasi.`,
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'Sangat Keruh',
        badgeColor: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        desc: `Air sangat keruh (> ${tKeruh} NTU). Perlu dilakukan pengurasan kolam atau filter intensif.`,
        icon: ShieldAlert
      };
    }
  };

  // Unduh Laporan PDF
  const handleDownloadPDF = async () => {
    if (!historyData || historyData.length === 0) {
      Swal.fire({
        title: 'Data Kosong',
        text: 'Belum ada data history untuk diunduh.',
        icon: 'warning',
        confirmButtonColor: '#0C4A6E'
      });
      return;
    }

    const doc = new jsPDF();
    const deviceName = devices[selectedDeviceId]?.name || selectedDeviceId;

    doc.setFillColor(12, 74, 110);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('NILA AQUASYNC', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(186, 230, 253);
    doc.setFont("helvetica", "normal");
    doc.text('Laporan Pemantauan Kekeruhan & Kejernihan Air Kolam Nila', 14, 27);

    doc.setFillColor(240, 249, 255);
    doc.rect(14, 45, 182, 30, 'F');

    doc.setFontSize(10);
    doc.setTextColor(12, 74, 110);
    doc.setFont("helvetica", "bold");
    doc.text('INFORMASI PERANGKAT & LOKASI', 20, 54);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(59, 107, 138);
    doc.text(`ID Perangkat : ${selectedDeviceId}`, 20, 62);
    doc.text(`Nama Kolam  : ${deviceName}`, 20, 68);

    doc.text(`Waktu Cetak  : ${new Date().toLocaleString('id-ID')}`, 115, 62);
    let printedBy = userData?.name || currentUser?.displayName || 'Administrator';
    doc.text(`Dicetak Oleh : ${printedBy}`, 115, 68);

    const tableColumn = ["Waktu Pengukuran", "Kekeruhan (NTU)", "Klasifikasi Kejernihan"];
    const tableRows = historyData.map(item => {
      const ntuVal = item.ntu ?? item.turbidity ?? 0;
      const fuzzy = getFuzzyNtuInfo(ntuVal);
      return [
        item.fullDate,
        ntuVal.toFixed(1),
        fuzzy.label
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5, halign: 'center', textColor: [59, 107, 138], lineColor: [224, 242, 254] },
      headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      margin: { top: 10, left: 14, right: 14 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Laporan dihasilkan otomatis oleh Nila AquaSync System - Halaman ${i} dari ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Laporan_AquaSync_${selectedDeviceId}.pdf`);
  };

  const currentNtu = data?.ntu ?? data?.turbidity ?? 0;
  const fuzzyStatus = getFuzzyNtuInfo(currentNtu);
  const StatusIcon = fuzzyStatus.icon;

  const tJernih = settings?.threshold_jernih ?? 25;
  const tAgakKeruh = settings?.threshold_agak_keruh ?? 45;
  const tKeruh = settings?.threshold_keruh ?? 65;
  const tSangatKeruh = settings?.threshold_sangat_keruh ?? 85;

  return (
    <div className="user-dashboard" style={{ paddingBottom: '2rem' }}>
      {Object.keys(devices).length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Server size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          <p>Anda belum memiliki alat terdaftar.</p>
          <Link to="/devices" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Ke Kelola Alat &rarr;</Link>
        </div>
      ) : (
        <>
          {/* Active Device Selector & PDF Download */}
          <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <select
                className="glass-panel"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', paddingRight: '2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, appearance: 'none', cursor: 'pointer', outline: 'none' }}
              >
                {Object.entries(devices).map(([id, device]) => (
                  <option key={id} value={id}>
                    {device.name || id}
                  </option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Server size={18} color="var(--primary)" />
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="btn-3d"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <PdfIcon size={18} />
              <span className="hide-on-mobile">Unduh PDF</span>
            </button>
          </div>

          {/* Real-time NTU Gauge Card (4 Level Classification) */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderLeft: `6px solid ${fuzzyStatus.badgeColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <Droplets size={18} color={fuzzyStatus.badgeColor} /> Pemantauan Kekeruhan Air Real-time
                </div>
                <div style={{ fontSize: 'clamp(2.2rem, 7vw, 3.2rem)', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {data ? currentNtu.toFixed(1) : '-'} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>NTU</span>
                </div>
              </div>

              <div style={{ background: fuzzyStatus.bg, padding: '0.6rem 1rem', borderRadius: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: `1px solid ${fuzzyStatus.badgeColor}` }}>
                <StatusIcon size={18} color={fuzzyStatus.badgeColor} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: fuzzyStatus.badgeColor }}>
                  {fuzzyStatus.label}
                </span>
              </div>
            </div>

            {/* Visual NTU Meter Bar with 4 Classification Ticks */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                <span>Jernih (≤{tJernih})</span>
                <span>Agak Keruh ({tAgakKeruh})</span>
                <span>Keruh ({tKeruh})</span>
                <span>Sangat Keruh (≥{tSangatKeruh})</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(Math.max((currentNtu / 100) * 100, 5), 100)}%`,
                    background: fuzzyStatus.badgeColor,
                    borderRadius: '5px',
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              💡 <strong>Analisis System:</strong> {fuzzyStatus.desc}
            </p>
          </div>

          {/* Indicator Cards Grid */}
          <div className="dashboard-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="glass-card-concave" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tingkat Kekeruhan Air</span>
                <Droplets size={16} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {data ? currentNtu.toFixed(1) : '-'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NTU</span>
              </div>
            </div>

            <div className="glass-card-concave" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Klasifikasi Kejernihan</span>
                <StatusIcon size={16} color={fuzzyStatus.badgeColor} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: fuzzyStatus.badgeColor }}>
                {fuzzyStatus.label}
              </div>
            </div>
          </div>

          {/* Historical Trends Charts */}
          <div style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LayoutDashboard size={20} color="var(--primary)" />
            <h3 className="title-gradient" style={{ fontSize: '1.2rem', margin: 0 }}>
              Grafik Riwayat Kekeruhan Air (NTU)
            </h3>
          </div>

          {historyData && historyData.length > 0 ? (
            <div className="glass-card-concave" style={{ padding: '1.25rem', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Droplets size={16} color="var(--primary)" /> Tren Kekeruhan Air (NTU)
              </h4>
              <div style={{ width: '100%', height: 260, marginTop: 'auto' }}>
                <ResponsiveContainer>
                  <LineChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(12, 74, 110, 0.1)" />
                    <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-outer)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} />
                    <Line type="monotone" dataKey="ntu" stroke="var(--primary)" name="Kekeruhan (NTU)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="glass-card-concave" style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <em>Menunggu pengiriman data history dari sensor kekeruhan air...</em>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserDashboard;
