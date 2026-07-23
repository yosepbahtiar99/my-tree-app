import { useMemo } from 'react';

interface PersonDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  person: any | null;
  allPersons?: any[];
  allMarriages?: any[];
  onAction?: (action: string, payload?: any) => void;
  isAdmin?: boolean;
}

export default function PersonDetailDrawer({ 
  isOpen, 
  onClose, 
  person, 
  allPersons = [], 
  allMarriages = [],
  onAction,
  isAdmin = false
}: PersonDetailDrawerProps) {

  // Ambil detail keluarga jika ada person
  const { spouses, children, parents } = useMemo(() => {
    if (!person) return { spouses: [], children: [], parents: [] };
    
    // Cari pasangan
    const personMarriages = allMarriages.filter(
      m => m.husbandId === person.id || m.wifeId === person.id
    );
    const spousesList = personMarriages.map(m => {
      const spouseId = m.husbandId === person.id ? m.wifeId : m.husbandId;
      return allPersons.find(p => p.id === spouseId);
    }).filter(Boolean);

    // Cari anak-anak
    const childrenList = allPersons.filter(
      p => p.fatherId === person.id || p.motherId === person.id
    );

    // Cari orang tua
    const parentsList = [];
    if (person.fatherId) {
      const father = allPersons.find(p => p.id === person.fatherId);
      if (father) parentsList.push({ ...father, label: 'Ayah' });
    }
    if (person.motherId) {
      const mother = allPersons.find(p => p.id === person.motherId);
      if (mother) parentsList.push({ ...mother, label: 'Ibu' });
    }

    return { spouses: spousesList, children: childrenList, parents: parentsList };
  }, [person, allPersons, allMarriages]);

  if (!isOpen || !person) return null;

  const imageUrl = person.photoId 
    ? `${import.meta.env.VITE_API_URL}/uploads/${person.photoId}`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-screen sm:left-auto sm:right-0 sm:w-[400px] z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-slate-50 shrink-0">
          <h2 className="font-serif font-bold text-lg text-foreground truncate pr-4">Detail Profil</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Photo */}
          <div className="w-full aspect-square bg-slate-100 relative shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={person.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-7xl font-serif">
                {person.fullName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="p-6 relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-1 leading-tight">{person.fullName}</h2>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  {person.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                </p>
              </div>
              
              {onAction && (
                <button 
                  onClick={() => onAction('FOCUS_FAMILY', person)}
                  className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors shrink-0 mt-1"
                >
                  🎯 Fokus
                </button>
              )}
            </div>
            
            <div className="space-y-4 text-sm mb-8">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Usia</span>
                <span className="font-medium text-foreground">
                  {person.age !== null && person.age !== undefined ? `${person.age} Tahun` : 'Tidak Diketahui'}
                </span>
              </div>
              
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Tanggal Lahir</span>
                <span className="font-medium text-foreground">
                  {person.birthDate ? new Date(person.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </span>
              </div>

              {person.isDeceased && (
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Tanggal Wafat</span>
                  <span className="font-medium text-foreground">
                    {person.deathDate ? new Date(person.deathDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </span>
                </div>
              )}
            </div>

            {/* Hubungan Keluarga */}
            <div className="space-y-6">
              {parents.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Orang Tua</h3>
                  <div className="space-y-2">
                    {parents.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors" onClick={() => onAction && onAction('VIEW_PERSON', p)}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          {p.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {spouses.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Pasangan</h3>
                  <div className="space-y-2">
                    {spouses.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors" onClick={() => onAction && onAction('VIEW_PERSON', s)}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          {s.fullName.charAt(0)}
                        </div>
                        <p className="text-sm font-medium text-foreground">{s.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Anak ({children.length})</h3>
                  <div className="space-y-2">
                    {children.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-colors" onClick={() => onAction && onAction('VIEW_PERSON', c)}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                          {c.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.fullName}</p>
                          <p className="text-xs text-muted-foreground">{c.gender === 'MALE' ? 'Anak Laki-Laki' : 'Anak Perempuan'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions (Khusus Admin) */}
        {isAdmin && onAction && (
          <div className="p-4 border-t border-border/50 bg-slate-50 grid grid-cols-2 gap-2">
            <button 
              onClick={() => onAction('EDIT', person)}
              className="px-3 py-2 text-sm font-medium border border-slate-200 bg-white rounded-md hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              ✏️ Edit Profil
            </button>
            <button 
              onClick={() => onAction('ADD_SPOUSE', person)}
              className="px-3 py-2 text-sm font-medium border border-slate-200 bg-white rounded-md hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              💍 Tambah Pasangan
            </button>
            <button 
              onClick={() => onAction('ADD_CHILD', person)}
              className="px-3 py-2 text-sm font-medium border border-slate-200 bg-white rounded-md hover:bg-slate-50 text-slate-700 shadow-sm col-span-2"
            >
              👶 Tambah Anak
            </button>
          </div>
        )}
      </div>
    </>
  );
}
