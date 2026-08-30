import { useState, useEffect } from 'react';
import { ref, push, onValue, set, remove, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { PlusCircle, CheckCircle2, Clock, FileText, Trash2 } from 'lucide-react';

function UserTickets() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const ticketsQuery = query(ref(database, 'tickets'), orderByChild('user_uid'), equalTo(currentUser.uid));
    const unsubTickets = onValue(ticketsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userTicketsList = Object.entries(data)
          .map(([id, t]) => ({ id, ...t }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setTickets(userTicketsList);
      } else {
        setTickets([]);
      }
    }, (error) => {
      console.error("Firebase Read Error:", error);
    });

    return () => unsubTickets();
  }, [currentUser]);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setLoading(true);
    const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', htmlContainer: 'glass-swal-content', confirmButton: 'glass-swal-confirm' } };

    try {
      const ticketsRef = ref(database, 'tickets');
      const newTicketRef = push(ticketsRef);
      await set(newTicketRef, {
        user_uid: currentUser.uid,
        user_name: currentUser.displayName || currentUser.email,
        title: newTitle,
        description: newDescription,
        status: 'open',
        timestamp: Date.now()
      });

      setShowAddForm(false);
      setNewTitle('');
      setNewDescription('');

      Swal.fire({
        ...swalConfig,
        title: 'Berhasil!',
        text: 'Pengaduan berhasil dikirim. Tim kami akan segera menindaklanjuti.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ ...swalConfig, title: 'Gagal', text: 'Gagal mengirim pengaduan: ' + err.message, icon: 'error' });
    }
    setLoading(false);
  };

  const handleDeleteTicket = async (ticketId) => {
    const swalConfig = { customClass: { popup: 'glass-swal', title: 'glass-swal-title', htmlContainer: 'glass-swal-content', confirmButton: 'glass-swal-confirm', cancelButton: 'glass-swal-cancel' } };
    const confirm = await Swal.fire({
      ...swalConfig,
      title: 'Tarik Pengaduan?',
      text: 'Apakah Anda yakin ingin menarik/menghapus pengaduan ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tarik',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (confirm.isConfirmed) {
      try {
        await remove(ref(database, `tickets/${ticketId}`));
        Swal.fire({ ...swalConfig, title: 'Berhasil!', text: 'Pengaduan berhasil ditarik.', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (err) {
        Swal.fire({ ...swalConfig, title: 'Gagal', text: err.message, icon: 'error' });
      }
    }
  };

  return (
    <div className="user-tickets" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-3d"
          style={{ padding: '0.6rem 1.2rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={18} /> Buat Tiket
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Buat Pengaduan Baru</h3>
          <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Judul Kendala</label>
              <input
                type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="misal: Sensor NTU Rusak / Pembacaan Keruh Terus"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Detail Kerusakan / Error</label>
              <textarea
                required value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Deskripsikan kronologi atau detail kerusakan yang Anda alami..."
                rows="4"
                style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-main)', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-3d-secondary" style={{ flex: 1 }}>Batal</button>
              <button type="submit" disabled={loading} className="btn-3d" style={{ flex: 2 }}>
                {loading ? 'Mengirim...' : 'Kirim Pengaduan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tickets.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>Anda belum pernah membuat riwayat pengaduan.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="glass-card" style={{ padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.3rem 1rem', fontSize: '0.75rem', fontWeight: 700, borderBottomLeftRadius: 'var(--radius-sm)', background: ticket.status === 'open' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)', color: ticket.status === 'open' ? '#eab308' : '#22c55e' }}>
                {ticket.status === 'open' ? 'DIPROSES' : 'SELESAI'}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.8rem', borderRadius: '50%', background: ticket.status === 'open' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}>
                  {ticket.status === 'open' ? <Clock size={24} color="#eab308" /> : <CheckCircle2 size={24} color="#22c55e" />}
                </div>
                <div style={{ flex: 1, paddingRight: '4rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{ticket.title}</h3>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {ticket.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dibuat: {new Date(ticket.timestamp).toLocaleString('id-ID')}
                    </div>
                    {ticket.status === 'open' && (
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="btn-3d btn-danger"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        title="Tarik Pengaduan"
                      >
                        <Trash2 size={14} /> Tarik Tiket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserTickets;
