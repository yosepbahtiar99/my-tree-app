import { useState, useRef, useEffect } from 'react';
import { Panel, useReactFlow } from '@xyflow/react';

interface SearchBarProps {
  persons: any[];
  onHighlight: (id: string) => void;
}

export default function SearchBar({ persons, onHighlight }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { getNodes, setCenter } = useReactFlow();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPersons = query 
    ? persons.filter(p => p.fullName.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (person: any) => {
    setQuery('');
    setShowDropdown(false);
    
    // Find node in React Flow
    const nodes = getNodes();
    const node = nodes.find(n => n.id === person.id.toString());
    
    if (node) {
      // Pindahkan layar ke tengah node (nodeWidth=200, nodeHeight=150)
      setCenter(node.position.x + 100, node.position.y + 75, { zoom: 1.2, duration: 1000 });
      // Beritahu TreePage untuk menyalakan glow
      onHighlight(person.id.toString());
    }
  };

  return (
    <Panel position="top-left" className="m-4">
      <div className="relative w-64" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              if (query) setShowDropdown(true);
            }}
            placeholder="🔍 Cari anggota keluarga..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white/90 backdrop-blur-sm"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {showDropdown && query && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
            {filteredPersons.length > 0 ? (
              filteredPersons.map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800">{p.fullName}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-slate-500 text-center">
                Tidak ditemukan
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
