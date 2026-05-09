import { auth } from '@/src/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, User as UserIcon, Leaf, ShieldCheck, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  user: any;
  isAdmin: boolean;
  onAdminClick: () => void;
  onRegisterClick: () => void;
}

export function Navbar({ user, isAdmin, onAdminClick, onRegisterClick }: AuthProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="https://lh3.googleusercontent.com/d/1BXpvVUDwLx3ddwPiPM7M_lUJu5sT9npo" 
              alt="Idea Verde" 
              className="h-14 w-auto drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">Idea Verde</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-primary">Conectando Soluciones</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm font-bold text-slate-600 hover:text-brand-primary transition-colors"
              >
                Inicio
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-slate-600 hover:text-brand-primary transition-colors"
              >
                Cómo Funciona
              </button>
              <button 
                onClick={() => document.getElementById('explorer-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-slate-600 hover:text-brand-primary transition-colors"
              >
                Mapa
              </button>
              <button 
                onClick={() => document.getElementById('initiatives-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-slate-600 hover:text-brand-primary transition-colors"
              >
                Iniciativas
              </button>
              <button 
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-bold text-slate-600 hover:text-brand-primary transition-colors"
              >
                FAQ
              </button>
            </div>

            <button 
              onClick={onRegisterClick}
              className="hidden sm:flex items-center gap-2 text-brand-primary font-bold hover:text-brand-secondary transition-colors"
            >
              <Plus size={18} /> Registrar Iniciativa
            </button>

            <button 
              onClick={onAdminClick}
              className="text-[10px] text-slate-400 hover:text-brand-primary transition-colors uppercase font-bold tracking-tighter"
              title="Panel de Administración"
            >
              {isAdmin ? <ShieldCheck size={16} className="text-brand-primary" /> : "Admin"}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Colaborador</p>
                </div>
                <div className="relative group">
                  <img src={user.photoURL} alt="profile" className="w-10 h-10 rounded-full border-2 border-brand-primary/20 p-0.5" />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                      id="logout-btn"
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="hidden sm:flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white rounded-xl font-bold hover:bg-brand-primary transition-all shadow-lg shadow-brand-secondary/10"
                id="login-btn"
              >
                <LogIn size={18} /> Iniciar Sesión con Google
              </button>
            )}

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-brand-primary transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-8 space-y-6">
              {[
                { label: 'Inicio', target: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'Cómo Funciona', target: 'how-it-works' },
                { label: 'Mapa de Impacto', target: 'explorer-section' },
                { label: 'Iniciativas', target: 'initiatives-section' },
                { label: 'Preguntas Frecuentes', target: 'faq' },
              ].map((link, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    if (typeof link.target === 'string') {
                      document.getElementById(link.target)?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      link.target();
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left font-black text-slate-900 text-2xl tracking-tighter"
                >
                  {link.label}
                </button>
              ))}
              
              <div className="pt-6 border-t border-slate-100 gap-4 flex flex-col">
                <button 
                  onClick={() => {
                    onRegisterClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Registrar Iniciativa
                </button>
                {!user && (
                  <button 
                    onClick={() => {
                      handleLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <LogIn size={20} /> Iniciar Sesión con Google
                  </button>
                )}
                {user && (
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} /> Cerrar Sesión
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

interface AuthHeroProps {
  onRegisterClick: () => void;
}

export function AuthHero({ onRegisterClick }: AuthHeroProps) {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <div className="py-20 text-center space-y-8 bg-brand-light rounded-[3rem] px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          Registra tu proyecto y <span className="text-brand-primary italic">transforma el mundo</span>.
        </h2>
        <p className="text-xl text-slate-600 px-10">
          Únete a la mayor red de iniciativas ecológicas y sociales en Latinoamérica. Crea tu perfil para registrar tus acciones.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onRegisterClick}
            className="w-full sm:w-auto px-10 py-5 bg-brand-primary text-white rounded-2xl font-bold text-lg hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
          >
            <Plus size={24} /> Registrar mi Iniciativa
          </button>
          <button 
            onClick={handleLogin}
            className="w-full sm:w-auto px-10 py-5 bg-white text-slate-800 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            <LogIn size={24} /> Acceder con Google
          </button>
        </div>
      </div>
    </div>
  );
}
