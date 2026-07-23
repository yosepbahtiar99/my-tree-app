import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
// No need to import SERVER_URL

export default function PersonNode({ data }: any) {
  const isDeceased = data.isDeceased;
  const genderColor = data.gender === 'MALE' ? 'border-blue-400' : 'border-rose-400';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    // Gunakan capture: true agar event tertangkap sebelum diblokir oleh React Flow (panning/dragging)
    document.addEventListener('click', handleClickOutside, { capture: true });
    return () => document.removeEventListener('click', handleClickOutside, { capture: true });
  }, []);

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    setShowMenu(false);
    if (data.onAction) {
      data.onAction(action, data);
    }
  };
  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const isHighlighted = data.isHighlighted;
  const highlightClass = isHighlighted 
    ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-105 transition-all duration-300' 
    : 'transition-all duration-300';

  return (
    <div className={`relative bg-white border-t-4 ${genderColor} rounded-md shadow-md min-w-[180px] p-4 flex flex-col items-center justify-center ${showMenu ? 'menu-open !z-[9999]' : ''} ${highlightClass}`}>
      {/* Handles untuk Relasi Pasangan (Kiri & Kanan) - Dibuat Transparan */}
      <Handle type="source" position={Position.Right} id="right-source" className="!opacity-0 !cursor-default !w-1 !h-1" />
      <Handle type="source" position={Position.Left} id="left-source" className="!opacity-0 !cursor-default !w-1 !h-1" />
      
      {/* Target dari atas (Child) */}
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0 !cursor-default !w-1 !h-1" />
      {/* Source ke bawah (Parent tunggal) */}
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0 !cursor-default !w-1 !h-1" />
      
      {/* Indikator Meninggal */}
      {isDeceased && (
        <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded-sm">
          Alm
        </div>
      )}

      {/* Foto Profil */}
      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-slate-200">
        {data.photoId ? (
          <img 
            src={`${import.meta.env.VITE_API_URL}/uploads/${data.photoId}`} 
            alt={data.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Nama & Umur */}
      <div className="text-center">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight max-w-[140px] truncate">
          {data.fullName}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {data.age !== null ? `Usia: ${data.age} Tahun` : 'Usia: -'}
        </p>
      </div>

      {/* Tombol Tambah & Dropdown Menu (Hanya Tampil Jika Login) */}
      {data.user && (
        <div className="absolute -bottom-3" ref={menuRef}>
          <button 
            onClick={handleToggleMenu}
            className="bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl border border-slate-100 py-1 w-40 z-[99999] overflow-hidden">
              <button 
                onClick={(e) => handleAction(e, 'ADD_PARENT')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors flex items-center gap-2"
              >
                <span>👴</span> Tambah Orang Tua
              </button>
              <button 
                onClick={(e) => handleAction(e, 'ADD_CHILD')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <span>👶</span> Tambah Anak
              </button>
              <button 
                onClick={(e) => handleAction(e, 'ADD_SPOUSE')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors flex items-center gap-2"
              >
                <span>❤️</span> Tambah Pasangan
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={(e) => handleAction(e, 'EDIT_PROFILE')}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <span>✏️</span> Edit Profil
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
