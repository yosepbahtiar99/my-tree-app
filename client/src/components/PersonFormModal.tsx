import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useDialogStore } from '../store/dialogStore';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Image as ImageIcon } from 'lucide-react';

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  persons: any[];
  editData?: any;
  initialData?: any;
  addingParentForId?: string;
}

export default function PersonFormModal({ isOpen, onClose, onSuccess, persons, editData, initialData, addingParentForId }: PersonFormModalProps) {
  const { showAlert } = useDialogStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: editData?.fullName || '',
    gender: editData?.gender || 'MALE',
    birthDate: editData?.birthDate || '',
    isDeceased: editData?.isDeceased || false,
    deathDate: editData?.deathDate || '',
    fatherId: editData?.fatherId || initialData?.fatherId || '',
    motherId: editData?.motherId || initialData?.motherId || '',
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const imgRef = useRef<HTMLImageElement>(null);
  const [showCropper, setShowCropper] = useState(false);

  function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return null;
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    const targetWidth = Math.floor(completedCrop.width * scaleX);
    const targetHeight = Math.floor(completedCrop.height * scaleY);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, targetWidth, targetHeight
    );
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: editData?.fullName || '',
        gender: editData?.gender || 'MALE',
        birthDate: editData?.birthDate || '',
        isDeceased: editData?.isDeceased || false,
        deathDate: editData?.deathDate || '',
        fatherId: editData?.fatherId || initialData?.fatherId || '',
        motherId: editData?.motherId || initialData?.motherId || '',
      });
      setPhotoFile(null);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      setShowCropper(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, editData, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoId = editData?.photoId;

      if (photoFile && showCropper) {
        const finalBlob = await getCroppedImg();
        if (finalBlob) {
          const formDataUpload = new FormData();
          const croppedFile = new File([finalBlob], 'cropped.jpg', { type: 'image/jpeg' });
          formDataUpload.append('photo', croppedFile);
          const resPhoto = await api.post('/persons/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          photoId = resPhoto.data.photoId;
        }
      } else if (photoFile) {
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

      if (addingParentForId) {
        await api.post(`/persons/${addingParentForId}/add-parent`, payload);
      } else if (editData) {
        await api.put(`/persons/${editData.id}`, payload);
      } else {
        await api.post('/persons', payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 413) {
        showAlert({ title: 'Gagal', message: 'Ukuran file terlalu besar. Silakan pilih foto dengan ukuran lebih kecil.', type: 'error' });
      } else {
        showAlert({ title: 'Gagal', message: 'Gagal menyimpan data anggota keluarga.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const males = persons.filter(p => p.gender === 'MALE' && p.id !== editData?.id);
  const females = persons.filter(p => p.gender === 'FEMALE' && p.id !== editData?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[100vw] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-serif font-bold text-foreground">
            {addingParentForId ? 'Tambah Orang Tua' : (editData ? 'Edit Data Anggota' : 'Tambah Anggota Keluarga')}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nama Lengkap *</label>
              <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 min-h-[44px] border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Jenis Kelamin</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 min-h-[44px] border rounded-md bg-white">
                <option value="MALE">Laki-Laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tanggal Lahir</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-4 py-3 min-h-[44px] border rounded-md" />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" name="isDeceased" checked={formData.isDeceased} onChange={handleChange} className="w-4 h-4 mr-2" />
              <label className="text-sm font-medium text-foreground">Sudah Wafat</label>
            </div>
            {formData.isDeceased && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tanggal Wafat</label>
                <input type="date" name="deathDate" value={formData.deathDate} onChange={handleChange} className="w-full px-4 py-3 min-h-[44px] border rounded-md" />
              </div>
            )}
            
            {!addingParentForId && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Ayah</label>
                  <select 
                    value={formData.fatherId} 
                    onChange={(e) => setFormData({...formData, fatherId: e.target.value})}
                    className="w-full px-4 py-3 min-h-[44px] border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="">-- Tidak Diketahui --</option>
                    {males.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Ibu</label>
                  <select 
                    value={formData.motherId} 
                    onChange={(e) => setFormData({...formData, motherId: e.target.value})}
                    className="w-full px-4 py-3 min-h-[44px] border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="">-- Tidak Diketahui --</option>
                    {females.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-2 border-t border-border/50">
              <label className="block text-sm font-medium text-foreground mb-3">Foto Wajah</label>
              
              {editData?.photoId && !photoFile && (
                <div className="mb-4 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/uploads/${editData.photoId}`} 
                    alt="Foto saat ini" 
                    className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-white"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Foto Saat Ini</p>
                    <p className="text-xs text-muted-foreground">Pilih foto baru di bawah jika ingin mengganti.</p>
                  </div>
                </div>
              )}

              {!showCropper && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center p-6 bg-blue-50/50 text-blue-600 rounded-2xl hover:bg-blue-50 transition-colors border border-blue-100/50 group border-dashed"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <span className="font-medium text-sm">Pilih Foto dari Galeri/File</span>
                  </button>
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                className="hidden"
              />
              {photoFile && !showCropper && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 p-2 rounded-md">
                  <span>✅ File terpilih: {photoFile.name}</span>
                </div>
              )}
              
              {showCropper && imgSrc && (
                <div className="mt-4 border border-border p-3 bg-slate-50 rounded-lg shadow-sm">
                  <p className="text-sm font-medium mb-2 text-slate-700">Sesuaikan Area Wajah (Potongan 1:1)</p>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    className="max-h-[300px] overflow-hidden rounded-md border border-slate-300 flex justify-center bg-black/5"
                  >
                    <img 
                      ref={imgRef} 
                      alt="Crop" 
                      src={imgSrc} 
                      onLoad={onImageLoad} 
                      style={{ maxHeight: '300px', objectFit: 'contain' }} 
                    />
                  </ReactCrop>
                  <div className="mt-3 text-xs text-muted-foreground bg-white p-2 rounded border border-slate-200 shadow-sm">
                    💡 Geser kotak pemotong di atas ke area wajah yang diinginkan. Gambar akan dipotong secara otomatis saat ditekan tombol Simpan.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={onClose} className="px-6 py-3 min-h-[44px] border rounded-md text-foreground hover:bg-muted font-medium">Batal</button>
            <button type="submit" disabled={loading} className="px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
