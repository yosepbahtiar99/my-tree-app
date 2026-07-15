import { useState } from 'react';
import { api } from '../lib/api';

interface MarriageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  persons: any[];
}

export default function MarriageFormModal({ isOpen, onClose, onSuccess, persons }: MarriageFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [husbandId, setHusbandId] = useState('');
  const [wifeId, setWifeId] = useState('');
  const [marriageDate, setMarriageDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!husbandId && !wifeId) {
      alert('Harap pilih minimal salah satu pasangan (Suami atau Istri)');
      return;
    }

    setLoading(true);
    try {
      await api.post('/marriages', { 
        husbandId: husbandId || null, 
        wifeId: wifeId || null, 
        marriageDate: marriageDate || null 
      });
      onSuccess();
      onClose();
      // Reset form
      setHusbandId('');
      setWifeId('');
      setMarriageDate('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan data pernikahan');
    } finally {
      setLoading(false);
    }
  };

  const males = persons.filter(p => p.gender === 'MALE');
  const females = persons.filter(p => p.gender === 'FEMALE');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-foreground">Tambah Pasangan</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pilih Suami</label>
              <select 
                value={husbandId} 
                onChange={(e) => setHusbandId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Pilih Laki-laki --</option>
                {males.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pilih Istri</label>
              <select 
                value={wifeId} 
                onChange={(e) => setWifeId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Pilih Perempuan --</option>
                {females.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tanggal Pernikahan (Opsional)</label>
              <input 
                type="date" 
                value={marriageDate} 
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-input text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pasangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
