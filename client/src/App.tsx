import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, LogIn, UserPlus, TreePine, KeyRound, Menu, X, Image as ImageIcon, FileText } from 'lucide-react';
import TreePage from './pages/TreePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { ReactFlowProvider, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import { useAuthStore } from './store/authStore';
import { useDialogStore } from './store/dialogStore';
import GlobalDialogs from './components/GlobalDialogs';
import ChangePasswordModal from './components/ChangePasswordModal';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuthStore();
  const { showAlert } = useDialogStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { getNodes } = useReactFlow();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handlePasswordClick = () => {
    setIsPasswordModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const downloadTree = async (format: 'png' | 'pdf') => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const currentNodes = getNodes();
      if (currentNodes.length === 0) return;

      const nodesBounds = getNodesBounds(currentNodes);
      const width = nodesBounds.width + 200;
      const height = nodesBounds.height + 200;
      const viewport = getViewportForBounds(nodesBounds, width, height, 0.5, 2, 0);

      const element = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!element) return;

      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });

      if (format === 'png') {
        const a = document.createElement('a');
        a.setAttribute('download', 'silsilah-keluarga.png');
        a.setAttribute('href', dataUrl);
        a.click();
      } else {
        const orientation = width > height ? 'l' : 'p';
        const pdf = new jsPDF({
          orientation,
          unit: 'px',
          format: [width, height]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save('silsilah-keluarga.pdf');
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Gagal Ekspor', message: 'Gagal mengekspor silsilah. Coba lagi.', type: 'error' });
    } finally {
      setIsExporting(false);
      setIsMobileMenuOpen(false);
    }
  };

  const isTreePage = location.pathname === '/';

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 min-h-[4rem]">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <TreePine size={20} />
              </div>
              <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">Silsilahku</Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex flex-wrap items-center gap-4 font-sans text-sm font-medium">
              <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 min-h-[44px]">
                <Home size={16} /> Tree
              </Link>
              {token ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 min-h-[44px]">
                    Dashboard
                  </Link>
                  <button 
                    type="button"
                    onClick={handlePasswordClick} 
                    className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <KeyRound size={16} /> Ganti Password
                  </button>
                  <button type="button" onClick={handleLogout} className="px-4 py-2 min-h-[44px] rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 min-h-[44px]">
                    <LogIn size={16} /> Login
                  </Link>
                  <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    <UserPlus size={16} /> Daftar Editor
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex sm:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
          />
          
          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <span className="font-serif text-xl font-bold text-foreground">Menu</span>
              <button 
                onClick={closeMenu}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-2 font-sans text-base font-medium overflow-y-auto pb-6">
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-md text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]">
                <Home size={20} className="text-slate-400" /> Tree
              </Link>
              
              {token ? (
                <>
                  <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-md text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]">
                    <TreePine size={20} className="text-slate-400" /> Dashboard
                  </Link>
                  <button 
                    onClick={handlePasswordClick} 
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] text-left"
                  >
                    <KeyRound size={20} className="text-slate-400" /> Ganti Password
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px] text-left mt-2"
                  >
                    <LogIn size={20} className="text-rose-400" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-md text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]">
                    <LogIn size={20} className="text-slate-400" /> Login
                  </Link>
                  <Link to="/register" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 mt-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm min-h-[44px]">
                    <UserPlus size={20} /> Daftar Editor
                  </Link>
                </>
              )}

              {/* Download Options (Only visible on Tree Page) */}
              {isTreePage && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Ekspor Silsilah</h4>
                  <button 
                    onClick={() => downloadTree('png')}
                    disabled={isExporting}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] w-full text-left disabled:opacity-50"
                  >
                    <ImageIcon size={20} className="text-slate-400" /> Download Gambar (PNG)
                  </button>
                  <button 
                    onClick={() => downloadTree('pdf')}
                    disabled={isExporting}
                    className="flex items-center gap-3 px-3 py-3 rounded-md text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] w-full text-left disabled:opacity-50"
                  >
                    <FileText size={20} className="text-slate-400" /> Download Dokumen (PDF)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col font-sans overflow-x-hidden">
        <ReactFlowProvider>
          <GlobalDialogs />
          <Navbar />
          <main className="flex-1 w-full relative">
            <Routes>
              <Route path="/" element={<TreePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </ReactFlowProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
