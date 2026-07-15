import { Handle, Position } from '@xyflow/react';
// No need to import SERVER_URL

export default function PersonNode({ data }: any) {
  const isDeceased = data.isDeceased;
  const genderColor = data.gender === 'MALE' ? 'border-blue-400' : 'border-rose-400';
  
  return (
    <div className={`relative bg-white border-t-4 ${genderColor} rounded-md shadow-md min-w-[180px] p-4 flex flex-col items-center justify-center`}>
      {/* Handles untuk Relasi Pasangan (Kiri & Kanan) */}
      <Handle type="source" position={Position.Right} id="right" className="!bg-slate-400 !w-2 !h-2 !-right-1" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-slate-400 !w-2 !h-2 !-left-1" />
      
      {/* Handles untuk Relasi Anak-Orangtua (Atas & Bawah) */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-slate-400 !w-2 !h-2" />
      
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
            src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${data.photoId}`} 
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

      {/* Tombol Tambah (Placeholder ala MyHeritage) */}
      <div className="absolute -bottom-3 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}
