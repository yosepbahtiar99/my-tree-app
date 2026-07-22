import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDialogStore } from '../store/dialogStore';
import { api } from '../lib/api';
import PersonFormModal from '../components/PersonFormModal';
import MarriageFormModal from '../components/MarriageFormModal';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { showAlert, showConfirm } = useDialogStore();
  const [persons, setPersons] = useState<any[]>([]);
  const [marriages, setMarriages] = useState<any[]>([]);
  const [allPersons, setAllPersons] = useState<any[]>([]);
  const [allMarriages, setAllMarriages] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarriageModalOpen, setIsMarriageModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editMarriageData, setEditMarriageData] = useState<any>(null);

  const [personsPage, setPersonsPage] = useState(1);
  const [personsTotalPages, setPersonsTotalPages] = useState(1);

  const [marriagesPage, setMarriagesPage] = useState(1);
  const [marriagesTotalPages, setMarriagesTotalPages] = useState(1);

  const fetchPersonsPaginated = async (page: number) => {
    try {
      const res = await api.get(`/persons?page=${page}&limit=10`);
      setPersons(res.data.data);
      setPersonsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch paginated persons', error);
    }
  };

  const fetchMarriagesPaginated = async (page: number) => {
    try {
      const res = await api.get(`/marriages?page=${page}&limit=10`);
      setMarriages(res.data.data);
      setMarriagesTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch paginated marriages', error);
    }
  };

  const fetchAllData = async () => {
    try {
      const [personsRes, pendingRes, marriagesRes, usersRes, logsRes] = await Promise.all([
        api.get('/persons'),
        user?.role === 'SUPER_ADMIN' ? api.get('/auth/pending-users') : Promise.resolve({ data: [] }),
        api.get('/marriages'),
        user?.role === 'SUPER_ADMIN' ? api.get('/auth/users') : Promise.resolve({ data: [] }),
        user?.role === 'SUPER_ADMIN' ? api.get('/audit') : Promise.resolve({ data: [] })
      ]);
      setAllPersons(personsRes.data);
      setPendingUsers(pendingRes.data);
      setAllMarriages(marriagesRes.data);
      setAllUsers(usersRes.data);
      setAuditLogs(logsRes.data);
    } catch (error) {
      console.error('Failed to fetch all data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchPersonsPaginated(personsPage), fetchMarriagesPaginated(marriagesPage), fetchAllData()]);
  };

  useEffect(() => {
    if (user) {
      fetchPersonsPaginated(personsPage);
    }
  }, [personsPage, user]);

  useEffect(() => {
    if (user) {
      fetchMarriagesPaginated(marriagesPage);
    }
  }, [marriagesPage, user]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/auth/approve/${id}`);
      fetchData(); // Refresh list
    } catch (error) {
      showAlert({ title: 'Gagal', message: 'Gagal menyetujui user', type: 'error' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Hapus Pengguna?',
      message: 'Yakin ingin menghapus pengguna ini? Akses mereka ke sistem akan dicabut.',
      type: 'danger',
      confirmText: 'Hapus'
    });

    if (confirmed) {
      try {
        await api.delete(`/auth/users/${id}`);
        fetchData();
      } catch (error: any) {
        showAlert({ title: 'Gagal', message: error.response?.data?.message || 'Gagal menghapus pengguna', type: 'error' });
      }
    }
  };

  const handleDeletePerson = async (id: number) => {
    // Validasi Opsi A: Blokir Keras (Strict Mode)
    const targetIdStr = id.toString();
    const hasChildren = allPersons.some(p => p.fatherId?.toString() === targetIdStr || p.motherId?.toString() === targetIdStr);
    if (hasChildren) {
      await showAlert({ title: 'Tidak Bisa Dihapus', message: 'Orang ini masih tercatat sebagai Orang Tua dari anggota keluarga lain. Silakan hapus atau ubah relasi anak-anaknya terlebih dahulu.', type: 'error' });
      return;
    }

    const hasMarriages = allMarriages.some(m => m.husbandId?.toString() === targetIdStr || m.wifeId?.toString() === targetIdStr);
    if (hasMarriages) {
      await showAlert({ title: 'Tidak Bisa Dihapus', message: 'Orang ini masih memiliki data Pernikahan. Silakan hapus data pernikahannya terlebih dahulu di tabel bawah.', type: 'error' });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Hapus Anggota Keluarga?',
      message: 'Yakin ingin menghapus anggota ini? Data yang dihapus tidak bisa dikembalikan.',
      type: 'danger',
      confirmText: 'Hapus'
    });

    if (confirmed) {
      try {
        await api.delete(`/persons/${id}`);
        fetchData();
      } catch (error: any) {
        showAlert({ title: 'Gagal', message: error.response?.data?.message || 'Gagal menghapus person', type: 'error' });
      }
    }
  };

  const handleEditMarriageClick = (marriage: any) => {
    setEditMarriageData(marriage);
    setIsMarriageModalOpen(true);
  };

  const handleDeleteMarriage = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Hapus Pernikahan?',
      message: 'Yakin ingin menghapus relasi pernikahan ini?',
      type: 'danger',
      confirmText: 'Hapus'
    });

    if (confirmed) {
      try {
        await api.delete(`/marriages/${id}`);
        fetchData();
      } catch (error) {
        showAlert({ title: 'Gagal', message: 'Gagal menghapus data pernikahan', type: 'error' });
      }
    }
  };

  const handleEditClick = (person: any) => {
    setEditData(person);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-6">Dashboard Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50">
          <h3 className="text-lg font-medium text-muted-foreground">Total Anggota</h3>
          <p className="text-4xl font-bold text-primary mt-2">{persons.length}</p>
        </div>
        {user?.role === 'SUPER_ADMIN' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50">
            <h3 className="text-lg font-medium text-muted-foreground">Menunggu Persetujuan</h3>
            <p className="text-4xl font-bold text-amber-500 mt-2">{pendingUsers.length}</p>
          </div>
        )}
      </div>

      {user?.role === 'SUPER_ADMIN' && pendingUsers.length > 0 && (
        <div className="bg-amber-50 p-6 rounded-xl shadow-sm border border-amber-200 mb-10">
          <h2 className="text-2xl font-serif font-bold text-amber-900 mb-4">Persetujuan Editor Baru</h2>
          <div className="space-y-4">
            {pendingUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                <div>
                  <p className="font-medium text-foreground">{u.email}</p>
                  <p className="text-sm text-muted-foreground">Mendaftar pada: {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleApprove(u.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Setujui
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-foreground">Daftar Anggota Keluarga</h2>
          <button onClick={handleAddClick} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            + Tambah Anggota
          </button>
        </div>
        
        <div className="mt-6 border border-border/50 rounded-lg overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lahir - Wafat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border/50">
              {persons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">Belum ada data anggota keluarga.</td>
                </tr>
              ) : persons.map((p, index) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{(personsPage - 1) * 10 + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{p.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {p.birthDate || '?'} - {p.isDeceased ? (p.deathDate || '?') : 'Sekarang'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{p.age ?? '?'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                    <button onClick={() => handleEditClick(p)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => handleDeletePerson(p.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 px-2">
          <button 
            disabled={personsPage <= 1} 
            onClick={() => setPersonsPage(p => p - 1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Halaman {personsPage} dari {personsTotalPages}
          </span>
          <button 
            disabled={personsPage >= personsTotalPages} 
            onClick={() => setPersonsPage(p => p + 1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50 mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-foreground">Daftar Pasangan (Pernikahan)</h2>
          <button onClick={() => { setEditMarriageData(null); setIsMarriageModalOpen(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors">
            + Tambah Pasangan
          </button>
        </div>
        
        <div className="mt-6 border border-border/50 rounded-lg overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Suami</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Istri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Menikah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border/50">
              {marriages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">Belum ada data pernikahan yang diinput secara eksplisit.</td>
                </tr>
              ) : marriages.map((m, index) => (
                <tr key={m.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{(marriagesPage - 1) * 10 + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{m.Husband ? m.Husband.fullName : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{m.Wife ? m.Wife.fullName : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{m.marriageDate || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                    <button onClick={() => handleEditMarriageClick(m)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => handleDeleteMarriage(m.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 px-2">
          <button 
            disabled={marriagesPage <= 1} 
            onClick={() => setMarriagesPage(p => p - 1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Halaman {marriagesPage} dari {marriagesTotalPages}
          </span>
          <button 
            disabled={marriagesPage >= marriagesTotalPages} 
            onClick={() => setMarriagesPage(p => p + 1)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md disabled:opacity-50 text-sm font-medium transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      </div>
      
      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50 mt-10">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Manajemen Pengguna</h2>
          <div className="border border-border/50 rounded-lg overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-border/50">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bergabung</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border/50">
                {allUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{u.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {u.isActive ? 'Aktif' : 'Menunggu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {u.role !== 'SUPER_ADMIN' ? (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                      ) : (
                        <span className="text-muted-foreground italic">Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50 mt-10">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Log Aktivitas (Audit Trail)</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada aktivitas yang terekam.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className={`p-2 rounded-full ${
                    log.action === 'CREATE' ? 'bg-green-100 text-green-600' :
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {log.action === 'CREATE' ? '➕' : log.action === 'UPDATE' ? '✏️' : '🗑️'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {log.Actor ? log.Actor.email : 'Unknown User'} 
                      <span className="font-normal text-muted-foreground"> melakukan </span>
                      <span className={`font-semibold ${
                        log.action === 'CREATE' ? 'text-green-600' :
                        log.action === 'UPDATE' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>{log.action}</span>
                      <span className="font-normal text-muted-foreground"> pada data </span>
                      {log.TargetPerson ? log.TargetPerson.fullName : (log.details?.id ? `ID: ${log.details.id}` : 'Data')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-2 text-xs bg-white p-2 rounded border border-border/50 overflow-x-auto text-slate-500">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <PersonFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        persons={allPersons}
        editData={editData}
      />

      <MarriageFormModal
        isOpen={isMarriageModalOpen}
        onClose={() => { setIsMarriageModalOpen(false); setEditMarriageData(null); }}
        onSuccess={fetchData}
        persons={allPersons}
        editData={editMarriageData}
      />
    </div>
  );
}
