import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, LogIn, UserPlus, TreePine, KeyRound } from 'lucide-react';
import TreePage from './pages/TreePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { ReactFlowProvider } from '@xyflow/react';

import { useAuthStore } from './store/authStore';
import GlobalDialogs from './components/GlobalDialogs';
import ChangePasswordModal from './components/ChangePasswordModal';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore(); // Basic check
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <TreePine size={20} />
              </div>
              <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-foreground">Silsilahku</Link>
            </div>
            
            <div className="flex items-center gap-4 font-sans text-sm font-medium">
              <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Home size={16} /> Tree
              </Link>
              {token ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                  <button 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    <KeyRound size={16} /> Ganti Password
                  </button>
                  <button type="button" onClick={handleLogout} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <LogIn size={16} /> Login
                  </Link>
                  <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    <UserPlus size={16} /> Daftar Editor
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col font-sans">
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
