import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useDialogStore } from '../store/dialogStore';

interface MarriageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  persons: any[];
  initialHusbandId?: string;
  initialWifeId?: string;
  editData?: any;
}

export default function MarriageFormModal({ isOpen, onClose, onSuccess, persons, initialHusbandId, initialWifeId, editData }: MarriageFormModalProps) {
  const { showAlert } = useDialogStore();
  const [loading, setLoading] = useState(false);
  const [husbandId, setHusbandId] = useState(initialHusbandId || '');
  const [wifeId, setWifeId] = useState(initialWifeId || '');
  const [marriageDate, setMarriageDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setHusbandId(editData.husbandId || '');
        setWifeId(editData.wifeId || '');
        setMarriageDate(editData.marriageDate || '');
      } else {
        setHusbandId(initialHusbandId || '');
        setWifeId(initialWifeId || '');
        setMarriageDate('');
      }
    }
  }, [isOpen, initialHusbandId, initialWifeId, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!husbandId && !wifeId) {
      showAlert({ title: 'Peringatan', message: 'Harap pilih minimal salah satu pasangan (Suami atau Istri)', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        husbandId: husbandId || null, 
        wifeId: wifeId || null, 
        marriageDate: marriageDate || null 
      };

      if (editData) {
        await api.put(`/marriages/${editData.id}`, payload);
      } else {
        await api.post('/marriages', payload);
      }

      onSuccess();
      onClose();
      // Reset form
      setHusbandId('');
      setWifeId('');
      setMarriageDate('');
    } catch (error: any) {
      showAlert({ title: 'Gagal', message: error.response?.data?.message || 'Gagal menyimpan data pernikahan', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const males = persons.filter(p => p.gender === 'MALE');
  const females = persons.filter(p => p.gender === 'FEMALE');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-foreground">{editData ? 'Edit Pasangan' : 'Tambah Pasangan'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pilih Suami</label>
              <select 
                value={husbandId} 
                onChange={(e) => setHusbandId(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
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
                className="w-full px-4 py-3 min-h-[44px] border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
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
                className="w-full px-4 py-3 min-h-[44px] border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border/50">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 min-h-[44px] border border-input text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pasangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
