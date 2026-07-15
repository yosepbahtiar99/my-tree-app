import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  persons: any[];
  editData?: any;
}

export default function PersonFormModal({ isOpen, onClose, onSuccess, persons, editData }: PersonFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: editData?.fullName || '',
    gender: editData?.gender || 'MALE',
    birthDate: editData?.birthDate || '',
    isDeceased: editData?.isDeceased || false,
    deathDate: editData?.deathDate || '',
    fatherId: editData?.fatherId || '',
    motherId: editData?.motherId || '',
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: editData?.fullName || '',
        gender: editData?.gender || 'MALE',
        birthDate: editData?.birthDate || '',
        isDeceased: editData?.isDeceased || false,
        deathDate: editData?.deathDate || '',
        fatherId: editData?.fatherId || '',
        motherId: editData?.motherId || '',
      });
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoId = editData?.photoId;

      if (photoFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('photo', photoFile);
        const resPhoto = await api.post('/persons/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoId = resPhoto.data.photoId;
      }

      const payload = {
        ...formData,
        birthDate: formData.birthDate ? formData.birthDate : null,
        deathDate: formData.isDeceased && formData.deathDate ? formData.deathDate : null,
        photoId,
        fatherId: formData.fatherId ? formData.fatherId : null,
        motherId: formData.motherId ? formData.motherId : null,
      };

      if (editData) {
        await api.put(`/persons/${editData.id}`, payload);
      } else {
        await api.post('/persons', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      alert('Gagal menyimpan data anggota keluarga.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-foreground">
            {editData ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nama Lengkap *</label>
              <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Jenis Kelamin</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                <option value="MALE">Laki-Laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tanggal Lahir</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" name="isDeceased" checked={formData.isDeceased} onChange={handleChange} className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium text-foreground">Sudah Wafat</label>
            </div>
            {formData.isDeceased && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tanggal Wafat</label>
                <input type="date" name="deathDate" value={formData.deathDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ayah (Pilih dari daftar)</label>
              <select name="fatherId" value={formData.fatherId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                <option value="">- Tidak Diketahui -</option>
                {persons.filter(p => p.gender === 'MALE' && p.id !== editData?.id).map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ibu (Pilih dari daftar)</label>
              <select name="motherId" value={formData.motherId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                <option value="">- Tidak Diketahui -</option>
                {persons.filter(p => p.gender === 'FEMALE' && p.id !== editData?.id).map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Foto Wajah (Ambil Kamera / Pilih File)</label>
              
              {editData?.photoId && !photoFile && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Foto Saat Ini:</p>
                  <img 
                    src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${editData.photoId}`} 
                    alt="Foto saat ini" 
                    className="w-24 h-24 rounded-lg object-cover border border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pilih file baru jika ingin mengganti foto.</p>
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {photoFile && <p className="text-xs text-green-600 mt-1">File terpilih: {photoFile.name}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-foreground hover:bg-muted">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
