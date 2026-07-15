import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import PersonFormModal from '../components/PersonFormModal';
import MarriageFormModal from '../components/MarriageFormModal';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [persons, setPersons] = useState<any[]>([]);
  const [marriages, setMarriages] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarriageModalOpen, setIsMarriageModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [personsRes, pendingRes, marriagesRes] = await Promise.all([
        api.get('/persons'),
        user?.role === 'SUPER_ADMIN' ? api.get('/auth/pending-users') : Promise.resolve({ data: [] }),
        api.get('/marriages'),
      ]);
      setPersons(personsRes.data);
      setPendingUsers(pendingRes.data);
      setMarriages(marriagesRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/auth/approve/${id}`);
      fetchData(); // Refresh list
    } catch (error) {
      alert('Gagal menyetujui user');
    }
  };

  const handleDeletePerson = async (id: number) => {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
      try {
        await api.delete(`/persons/${id}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus person');
      }
    }
  };

  const handleDeleteMarriage = async (id: string) => {
    if (confirm('Yakin ingin menghapus relasi pernikahan ini?')) {
      try {
        await api.delete(`/marriages/${id}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus data pernikahan');
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lahir - Wafat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border/50">
              {persons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">Belum ada data anggota keluarga.</td>
                </tr>
              ) : persons.map((p) => (
                <tr key={p.id}>
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
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-border/50 mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif font-bold text-foreground">Daftar Pasangan (Pernikahan)</h2>
          <button onClick={() => setIsMarriageModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors">
            + Tambah Pasangan
          </button>
        </div>
        
        <div className="mt-6 border border-border/50 rounded-lg overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-border/50">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Suami</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Istri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Menikah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border/50">
              {marriages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">Belum ada data pernikahan yang diinput secara eksplisit.</td>
                </tr>
              ) : marriages.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{m.Husband ? m.Husband.fullName : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">{m.Wife ? m.Wife.fullName : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{m.marriageDate || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                    <button onClick={() => handleDeleteMarriage(m.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <PersonFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        persons={persons}
        editData={editData}
      />

      <MarriageFormModal
        isOpen={isMarriageModalOpen}
        onClose={() => setIsMarriageModalOpen(false)}
        onSuccess={fetchData}
        persons={persons}
      />
    </div>
  );
}
