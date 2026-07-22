import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

export default function PersonNodeV2({ data }: any) {
  const isDeceased = data.isDeceased;
  const bgColor = data.gender === 'MALE' ? 'bg-[#334F9F] border-[#294080]' : 'bg-[#E23485] border-[#c02a70]';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
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
    <div className={`relative flex flex-row items-center w-[240px] rounded-full p-2 border shadow-sm cursor-pointer ${bgColor} ${showMenu ? 'menu-open !z-[9999]' : ''} ${highlightClass}`}>
      {/* Handles untuk Relasi Pasangan (Kiri & Kanan) - Dibuat Transparan */}
      <Handle type="source" position={Position.Right} id="right-source" className="!opacity-0 !cursor-default !w-1 !h-1" />
      <Handle type="source" position={Position.Left} id="left-source" className="!opacity-0 !cursor-default !w-1 !h-1" />
      
      {/* Target dari atas (Child) */}
      <Handle type="target" position={Position.Top} id="top" className="!opacity-0 !cursor-default !w-1 !h-1" />
      {/* Source ke bawah (Parent tunggal) */}
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0 !cursor-default !w-1 !h-1" />
      
      {/* Kiri: Foto Profil */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white shadow-inner bg-white flex items-center justify-center">
        {data.photoId ? (
          <img 
            src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${data.photoId}`} 
            alt={data.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )}
        
        {/* Indikator Meninggal ditumpuk di atas foto */}
        {isDeceased && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">Alm</span>
          </div>
        )}
      </div>

      {/* Tengah: Nama & Umur */}
      <div className="flex-1 px-3 text-left overflow-hidden">
        <h3 className="font-semibold text-white text-sm leading-tight truncate drop-shadow-sm">
          {data.fullName}
        </h3>
        <p className="text-xs text-white/80 mt-0.5">
          {data.age !== null ? `Usia: ${data.age} Tahun` : 'Usia: -'}
        </p>
      </div>

      {/* Kanan: Tombol Menu (Selalu Tampil) */}
      <div className="shrink-0 mr-1" ref={menuRef}>
        <button 
          onClick={handleToggleMenu}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-colors shadow-sm border border-transparent cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute top-12 right-0 bg-white rounded-lg shadow-2xl border border-slate-100 py-1 w-44 z-[99999] overflow-hidden">
            {data.user && (
              <>
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
                <div className="h-px bg-slate-100 my-1"></div>
              </>
            )}
            <button 
              onClick={(e) => handleAction(e, 'FOCUS_FAMILY')}
              className="w-full text-left px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
            >
              <span>🎯</span> Fokus Keluarga
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
