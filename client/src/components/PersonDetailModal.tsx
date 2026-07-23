
interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: any | null;
}

export default function PersonDetailModal({ isOpen, onClose, person }: PersonDetailModalProps) {
  if (!isOpen || !person) return null;

  const imageUrl = person.photoId 
    ? `${import.meta.env.VITE_API_URL}/uploads/${person.photoId}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-foreground transition-colors z-10"
        >
          &times;
        </button>
        
        <div className="relative h-32 bg-primary/10">
          {imageUrl && (
            <div 
              className="absolute inset-0 opacity-20 bg-cover bg-center blur-sm"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
        </div>
        
        <div className="px-8 pb-8 pt-0 relative">
          <div className="flex justify-center -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden relative">
              {imageUrl ? (
                <img src={imageUrl} alt={person.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-4xl font-serif">
                  {person.fullName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-1">{person.fullName}</h2>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              {person.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
            </p>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Usia</span>
              <span className="font-medium text-foreground">
                {person.age !== null && person.age !== undefined ? `${person.age} Tahun` : 'Tidak Diketahui'}
              </span>
            </div>
            
            {!person.isDeceased ? (
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Tanggal Lahir</span>
                <span className="font-medium text-foreground">
                  {person.birthDate ? new Date(person.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col border-b border-border/50 pb-2">
                <span className="text-muted-foreground mb-1">Masa Hidup</span>
                <span className="font-medium text-foreground">
                  {person.birthDate ? new Date(person.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '?'} 
                  {' - '} 
                  {person.deathDate ? new Date(person.deathDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '?'}
                </span>
              </div>
            )}
            
            {/* 
              Catatan: Jika kita butuh nampilin nama orang tua atau anak-anaknya di masa depan,
              kita bisa mengambil data relasinya dari backend dan merendernya di sini.
            */}
          </div>
          
        </div>
      </div>
    </div>
  );
}
