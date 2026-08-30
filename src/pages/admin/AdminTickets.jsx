import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebase';
import Swal from 'sweetalert2';
import { CheckCircle2, Clock, FileText, User, ChevronDown, ChevronUp } from 'lucide-react';

function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});

  useEffect(() => {
    const ticketsRef = ref(database, 'tickets');
    const unsubTickets = onValue(ticketsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTickets(Object.entries(data).map(([id, t]) => ({ id, ...t })).sort((a, b) => b.timestamp - a.timestamp));
      } else { setTickets([]); }
    });
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => { setUsers(snapshot.exists() ? snapshot.val() : {}); });
    return () => { unsubTickets(); unsubUsers(); };
  }, []);

  const handleResolveTicket = async (ticketId) => {
    const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', htmlContainer: 'glass-swal-content', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' } };
    const confirm = await Swal.fire({ ...swalConfig, title: 'Tandai Selesai?', text: 'Apakah pengaduan ini sudah berhasil ditangani?', icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Selesai', cancelButtonText: 'Batal', reverseButtons: true });
    if (confirm.isConfirmed) {
      try {
        await set(ref(database, `tickets/${ticketId}/status`), 'closed');
        Swal.fire({ ...swalConfig, title: 'Berhasil!', text: 'Status pengaduan berhasil diperbarui.', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (err) { Swal.fire({ ...swalConfig, title: 'Gagal', text: err.message, icon: 'error' }); }
    }
  };

  const openTickets = tickets.filter(t => t.status === 'open');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  const ticketsByUser = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.user_uid]) {
      const user = users[ticket.user_uid] || {};
      acc[ticket.user_uid] = { userName: user.name || ticket.user_name || 'Tanpa Nama', institution: user.institution || 'Lokasi Tidak Diketahui', userTickets: [] };
    }
    acc[ticket.user_uid].userTickets.push(ticket);
    return acc;
  }, {});

  const toggleExpandUser = (uid) => setExpandedUsers(prev => ({ ...prev, [uid]: !prev[uid] }));

  return (
    <div className="admin-tickets" style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Pantau dan tangani kendala sistem dari pengguna.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <Clock size={28} color="var(--status-warning)" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-warning)' }}>{openTickets.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Menunggu Penanganan</div>
        </div>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
          <CheckCircle2 size={28} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{closedTickets.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Selesai Ditangani</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(12, 74, 110, 0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Daftar Tiket Berdasarkan User</h3>
        {Object.keys(ticketsByUser).length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} /><p>Belum ada pengaduan yang masuk.</p>
          </div>
        ) : (
          Object.entries(ticketsByUser).map(([uid, { userName, institution, userTickets }]) => {
            const isExpanded = !!expandedUsers[uid];
            const hasOpen = userTickets.some(t => t.status === 'open');
            return (
              <div key={uid} className="glass-card" style={{ padding: 0, overflow: 'hidden', borderLeft: hasOpen ? '4px solid var(--status-warning)' : '4px solid var(--primary)' }}>
                <div onClick={() => toggleExpandUser(uid)} style={{ padding: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ background: 'rgba(12, 74, 110, 0.05)', padding: '0.6rem', borderRadius: '50%' }}><User size={20} color="var(--primary)" /></div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{userName}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.2rem' }}>{institution}</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userTickets.length} Tiket ({userTickets.filter(t => t.status === 'open').length} Menunggu)</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>
                {isExpanded && (
                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderTop: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {userTickets.map((ticket) => (
                      <div key={ticket.id} style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{ticket.title}</h4>
                          <div style={{ padding: '0.2rem 0.8rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '1rem', background: ticket.status === 'open' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)', color: ticket.status === 'open' ? '#eab308' : '#22c55e' }}>{ticket.status === 'open' ? 'DIPROSES' : 'SELESAI'}</div>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ticket.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ticket.timestamp).toLocaleString('id-ID')}</div>
                          {ticket.status === 'open' && (<button onClick={() => handleResolveTicket(ticket.id)} className="btn-3d" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={14} /> Tandai Selesai</button>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminTickets;
