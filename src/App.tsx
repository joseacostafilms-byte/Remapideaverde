import React, { useEffect, useState } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, setDoc, where, or, orderBy } from 'firebase/firestore';
import { Initiative, FirestoreErrorInfo } from './types';
import { Navbar, AuthHero } from './components/Navigation';
import AppMap from './components/Map';
import Dashboard from './components/Dashboard';
import InitiativeForm from './components/InitiativeForm';
import AdminPanel from './components/AdminPanel';
import { AnimatePresence, motion } from 'motion/react';
import { InitiativeStatus } from './types';
import { Map as MapIcon, LayoutDashboard, Database, Info, X, ExternalLink, Globe, Calendar, User as UserIcon, MapPin, Youtube, Search, ChevronLeft, ChevronRight, Filter, Facebook, Instagram, MessageCircle, Mail, Smartphone, Plus, Download, ShieldCheck } from 'lucide-react';
import { getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

enum View {
  MAP = 'map',
  DASHBOARD = 'dashboard',
  ADMIN = 'admin'
}

interface InitiativeCardProps {
  initiative: Initiative;
  onSelect: (i: Initiative) => void;
  onEdit?: (i: Initiative) => void;
  isOwner?: boolean;
  key?: string;
}

function AppInitiativeCard({ initiative, onSelect, onEdit, isOwner }: InitiativeCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-3xl p-5 border border-slate-100 hover:border-brand-primary/20 hover:shadow-xl transition-all duration-300 flex items-center gap-6"
    >
      {/* Flag Container */}
      <div className="shrink-0 cursor-pointer" onClick={() => onSelect(initiative)}>
        <div className="w-12 h-8 rounded-lg overflow-hidden shadow-sm border border-slate-50">
          <img 
            src={`https://flagcdn.com/w80/${initiative.country.toLowerCase()}.png`} 
            alt={`Bandera de ${initiative.country}`} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(initiative)}>
        <h3 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-brand-primary transition-colors truncate">
          {initiative.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {initiative.category}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {initiative.scope}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isOwner && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(initiative);
            }}
            className="p-3 bg-slate-50 text-slate-400 hover:bg-brand-light hover:text-brand-primary rounded-xl transition-all"
            title="Editar Iniciativa"
          >
            <ShieldCheck size={18} />
          </button>
        )}
        <div 
          onClick={() => onSelect(initiative)}
          className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all cursor-pointer"
        >
          <ChevronRight size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function InitiativeGrid({ initiatives, onSelect, onEdit, currentUser }: { initiatives: Initiative[], onSelect: (i: Initiative) => void, onEdit: (i: Initiative) => void, currentUser: User | null }) {
  return (
    <section id="initiatives-section" className="py-32 space-y-20 relative scroll-mt-24">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-light rounded-full border border-brand-primary/10">
          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
          <span className="text-brand-primary font-black uppercase tracking-[0.2em] text-[10px]">Iniciativas de Impacto</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
          Red de Soluciones <br/> <span className="text-brand-primary italic">Regenerativas</span>
        </h2>
        <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto">
          Conoce a las personas y proyectos que están transformando Latinoamérica con acciones positivas.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {initiatives.slice(0, 6).map((initiative) => (
          <AppInitiativeCard 
            key={initiative.id} 
            initiative={initiative} 
            onSelect={onSelect} 
            onEdit={onEdit}
            isOwner={currentUser?.uid === initiative.userId}
          />
        ))}
      </div>
      
      {initiatives.length > 6 && (
        <div className="text-center pt-8">
          <button 
            onClick={() => {
              const mapSection = document.getElementById('explorer-section');
              mapSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group inline-flex items-center gap-4 px-12 py-5 bg-white border border-slate-200 rounded-[2rem] text-slate-900 font-black uppercase tracking-widest text-xs hover:border-brand-primary hover:text-brand-primary transition-all shadow-sm hover:shadow-xl"
          >
            Ver Mapa Completo <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      )}
    </section>
  );
}

function Hero({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div className="video-container rounded-none">
      <div className="absolute inset-0 pointer-events-none overflow-hidden scale-110">
        <iframe 
          className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2"
          src="https://www.youtube.com/embed/y8UWOLDCO3g?autoplay=1&mute=1&loop=1&playlist=y8UWOLDCO3g&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      <div className="video-overlay font-sans relative z-10 px-4">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-10 w-full max-w-5xl"
        >
          <div className="space-y-4">
            <div className="bg-brand-accent/30 backdrop-blur-md px-6 py-2 rounded-full w-fit mx-auto border border-white/20">
              <span className="text-white text-xs font-bold uppercase tracking-[0.4em]">Idea Verde Connect</span>
            </div>
            <h2 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] drop-shadow-2xl font-display">
              Mapeando <br/> <span className="text-white">el Futuro</span>
            </h2>
            <p className="text-white/80 text-xl md:text-2xl font-medium max-w-2xl mx-auto drop-shadow-md">
              Explora la red más grande de proyectos regenerativos en Latinoamérica y registra tus acciones por el planeta.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => {
                const mapSection = document.getElementById('explorer-section');
                mapSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-bold text-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-2xl"
            >
              <Search size={22} className="text-brand-primary" /> Explorar Mapa
            </button>
            <button 
              onClick={() => onSearch('register')} // We will pass a callback to open form
              className="w-full sm:w-auto px-10 py-5 bg-brand-primary text-white rounded-[1.5rem] font-bold text-lg hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/40 border border-brand-accent/20"
            >
              <Plus size={22} /> Registrar Iniciativa
            </button>
          </div>

          <div className="max-w-2xl mx-auto group">
            <div className="relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-white/50 group-focus-within:text-brand-accent transition-colors">
                <Search size={22} />
              </div>
              <input 
                type="text"
                placeholder="Buscar por nombre, país o categoría..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] text-white placeholder:text-white/30 outline-none focus:ring-8 focus:ring-brand-accent/5 focus:border-brand-accent/20 transition-all text-lg font-medium shadow-3xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CTASection({ onRegisterClick }: { onRegisterClick: () => void }) {
  return (
    <section className="my-32 py-20 bg-brand-secondary rounded-[4rem] text-center px-8 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-primary/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-accent/20 rounded-full blur-[100px]" />
      
      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-[1] drop-shadow-xl">
            ¿Tienes un proyecto que <br/> <span className="text-brand-accent italic">impacte positivamente?</span>
          </h2>
          <p className="text-brand-light/70 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Únete a cientos de líderes ambientales y haz que tu iniciativa sea visible para el mundo.
          </p>
        </div>
        
        <button 
          onClick={onRegisterClick}
          className="px-16 py-6 bg-brand-accent text-brand-secondary rounded-[2rem] font-black text-xl hover:bg-white transition-all shadow-2xl hover:scale-105 active:scale-95 flex items-center gap-4 mx-auto uppercase tracking-widest"
        >
          <Plus size={28} /> Registra tu impacto ahora
        </button>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section className="my-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="lg:col-span-12 mb-4 text-center">
        <h2 className="text-4xl font-bold text-slate-800 tracking-tight">Idea Verde: <span className="text-brand-primary italic">Futuro Sostenible</span></h2>
        <p className="text-slate-500 mt-2 font-medium">Explora contenidos educativos y proyectos que están cambiando el paradigma ecológico.</p>
      </div>
      
      <div className="lg:col-span-7 aspect-video rounded-3xl overflow-hidden shadow-2xl">
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/FUQ4vJEBa1c" 
          title="Futuro Sostenible"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
      
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-brand-primary">
            <Youtube size={24} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Nuestro Canal de Youtube</h3>
          <p className="text-slate-600 leading-relaxed">
            "Idea Verde Latino" es una comunidad dedicada a la divulgación de prácticas regenerativas, entrevistas con líderes ambientales y tutoriales de sostenibilidad aplicable en toda la región.
          </p>
        </div>
        
        <a 
          href="https://youtube.com/@ideaverdelatino" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
        >
          <Youtube size={20} /> Idea Verde Latino
        </a>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: 'Localiza', desc: 'Explora el mapa para encontrar iniciativas cerca de ti.', icon: <MapPin size={32} /> },
    { title: 'Conecta', desc: 'Contacta directamente con los responsables de cada proyecto.', icon: <Mail size={32} /> },
    { title: 'Escala', desc: 'Registra tu propia iniciativa y amplifica tu impacto social.', icon: <Globe size={32} /> }
  ];

  return (
    <section id="how-it-works" className="py-24 grid grid-cols-1 md:grid-cols-3 gap-12 scroll-mt-24">
      {steps.map((s, idx) => (
        <div key={idx} className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-brand-light rounded-3xl flex items-center justify-center text-brand-primary group-hover:scale-110 group-hover:rotate-6 transition-transform">
            {s.icon}
          </div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{s.title}</h3>
          <p className="text-slate-500 leading-relaxed font-medium">{s.desc}</p>
        </div>
      ))}
    </section>
  );
}

function ImpactStats() {
  const stats = [
    { label: 'Iniciativas', value: '+1,200', sub: 'En toda la región' },
    { label: 'Países', value: '18', sub: 'Latinoamérica' },
    { label: 'Comunidad', value: '+50k', sub: 'Miembros activos' },
    { label: 'Impacto', value: '100%', sub: 'Regenerativo' }
  ];

  return (
    <section className="py-20 bg-slate-900 rounded-[4rem] px-8 mb-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        {stats.map((stat, i) => (
          <div key={i} className="text-center space-y-2">
            <h4 className="text-4xl md:text-6xl font-black text-brand-accent tracking-tighter">{stat.value}</h4>
            <div className="space-y-1">
              <p className="text-white font-bold uppercase tracking-widest text-xs">{stat.label}</p>
              <p className="text-slate-400 text-[10px] font-medium">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: '¿Es gratis registrar mi iniciativa?', a: 'Sí, Idea Verde es una plataforma abierta y gratuita para todos los proyectos que busquen generar un impacto positivo.' },
    { q: '¿Qué tipo de proyectos pueden participar?', a: 'Cualquier iniciativa de impacto social o ambiental: desde huertas comunitarias hasta empresas de energía renovable.' },
    { q: '¿Cómo se verifican los datos?', a: 'Contamos con una comunidad de voluntarios que revisa periódicamente la veracidad y el estado de los proyectos registrados.' }
  ];

  return (
    <section id="faq" className="py-32 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div className="space-y-6">
          <span className="text-brand-primary font-black uppercase tracking-[0.2em] text-[10px]">Ayuda & Soporte</span>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Preguntas <br/> <span className="text-brand-primary italic">Frecuentes</span></h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">
            Todo lo que necesitas saber sobre nuestra plataforma y cómo sumarte al cambio.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all open:ring-2 open:ring-brand-primary/20 cursor-pointer">
              <summary className="list-none flex items-center justify-between text-lg font-bold text-slate-800">
                {faq.q}
                <ChevronRight className="group-open:rotate-90 transition-transform text-brand-primary" size={20} />
              </summary>
              <p className="mt-4 text-slate-500 font-medium leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pt-32 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <img 
            src="https://lh3.googleusercontent.com/d/1BXpvVUDwLx3ddwPiPM7M_lUJu5sT9npo" 
            alt="Idea Verde" 
            className="h-16 w-auto"
          />
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
            Conectando el ecosistema regenerativo de Latinoamérica para construir un futuro compartido más verde y justo.
          </p>
          <div className="flex gap-4">
            {[Instagram, Facebook, MessageCircle].map((Icon, i) => (
              <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary/20 transition-all">
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">Explorar</h5>
          <ul className="space-y-4 text-slate-500 font-medium">
            <li><button onClick={() => document.getElementById('explorer-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-primary transition-colors">Mapa de Impacto</button></li>
            <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-primary transition-colors">¿Cómo Funciona?</button></li>
            <li><button onClick={() => document.getElementById('initiatives-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-primary transition-colors">Listado de Proyectos</button></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h5 className="font-black text-slate-900 uppercase tracking-widest text-xs">Contacto</h5>
          <ul className="space-y-4 text-slate-500 font-medium">
            <li className="flex items-center gap-3"><Mail size={18} className="text-brand-primary" /> Ideaverdelatino@gmail.com</li>
            <li className="flex items-center gap-3"><Smartphone size={18} className="text-brand-primary" /> +58 414 231 4194</li>
            <li className="flex items-center gap-3"><Instagram size={18} className="text-brand-primary" /> @ideaverdelatino</li>
          </ul>
        </div>
      </div>
      <div className="pt-12 border-t border-slate-100 flex flex-col md:row items-center justify-between gap-6">
        <p className="text-slate-400 text-xs font-medium italic">© 2026 Idea Verde Latino. Hecho con ❤️ por el planeta.</p>
        <div className="flex gap-8 text-slate-400 text-xs font-medium">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Términos</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(View.MAP);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);

  const handleSearch = (q: string) => {
    if (q === 'register') {
      setIsFormOpen(true);
    } else {
      setSearchQuery(q);
    }
  };

  const exportToPDF = async (initiative: Initiative) => {
    const element = document.getElementById('initiative-detail-card');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('initiative-detail-card');
          if (el) {
            // 1. Remove all external stylesheets and style tags
            // This is the primary source of oklch values in Tailwind 4
            const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(l => l.remove());
            const styles = clonedDoc.querySelectorAll('style');
            styles.forEach(s => s.remove());

            // 2. Traverse ALL elements in the clone to strip oklch from inline styles
            // html2canvas fails when it sees oklch in any style string it parses
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((node) => {
              const htmlNode = node as HTMLElement;
              
              // Clean up inline styles
              if (htmlNode.style && htmlNode.style.cssText.includes('oklch')) {
                // Simple regex replacement to swap oklch(any) with a neutral hex
                // html2canvas parser won't crash if it sees #hex
                htmlNode.style.cssText = htmlNode.style.cssText.replace(/oklch\([^)]+\)/g, '#1e293b');
              }

              // Also check specifically for common color properties that might be resolved as oklch
              const colorProps = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
              colorProps.forEach(prop => {
                const val = (htmlNode.style as any)[prop];
                if (val && val.includes('oklch')) {
                  (htmlNode.style as any)[prop] = '#1e293b';
                }
              });

              // Force layout styles that might be lost from removing stylesheets
              if (htmlNode.classList.contains('flex')) htmlNode.style.display = 'flex';
              if (htmlNode.classList.contains('grid')) htmlNode.style.display = 'grid';
              
              // Fix brand colors specifically
              if (htmlNode.classList.contains('bg-brand-primary')) htmlNode.style.backgroundColor = '#047857';
              if (htmlNode.classList.contains('bg-brand-light')) htmlNode.style.backgroundColor = '#ecfdf5';
              if (htmlNode.classList.contains('text-brand-primary')) htmlNode.style.color = '#047857';
              if (htmlNode.classList.contains('bg-white')) htmlNode.style.backgroundColor = '#ffffff';
              
              // Remove shadows and filters as they often use oklch in Tailwind 4
              htmlNode.style.boxShadow = 'none';
              htmlNode.style.filter = 'none';
              htmlNode.style.backdropFilter = 'none';
            });

            // 3. Inject a PDF-safe style block that ONLY uses HEX/RGB
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              #initiative-detail-card {
                background: #ffffff !important;
                color: #1e293b !important;
                font-family: sans-serif !important;
                padding: 40px !important;
                width: 1000px !important;
                margin: 0 auto !important;
              }
              * { border-color: #e2e8f0 !important; }
              .grid { display: grid !important; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
              .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
              .flex { display: flex !important; }
              .items-center { align-items: center !important; }
              .justify-center { justify-content: center !important; }
              .gap-4 { gap: 1rem !important; }
              .gap-10 { gap: 2.5rem !important; }
              .p-8 { padding: 32px !important; }
              .p-12 { padding: 48px !important; }
              .rounded-3xl { border-radius: 24px !important; }
              .rounded-2xl { border-radius: 16px !important; }
              .border { border: 1px solid #e2e8f0 !important; }
              .font-bold { font-weight: 700 !important; }
              .font-black { font-weight: 900 !important; }
              .text-xs { font-size: 12px !important; }
              .text-sm { font-size: 14px !important; }
              .text-lg { font-size: 18px !important; }
              .text-xl { font-size: 20px !important; }
              .text-2xl { font-size: 24px !important; }
              .text-3xl { font-size: 30px !important; }
              .text-4xl { font-size: 36px !important; }
              .text-5xl { font-size: 48px !important; }
              .w-full { width: 100% !important; }
              .h-full { height: 100% !important; }
              .object-cover { object-fit: cover !important; }
              .aspect-video { aspect-ratio: 16 / 9 !important; }
              .overflow-hidden { overflow: hidden !important; }
              button { display: none !important; }
              .video-overlay { display: none !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 280));
      pdf.save(`EcoIniciativa_${initiative.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un problema al generar el PDF. Esto suele deberse a que el navegador no soporta ciertas funciones de color modernas. Intenta usar Chrome o Safari actualizado.');
    }
  };

  const filteredInitiatives = initiatives.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Non-admins only see approved ones (and their own pending ones)
    if (isAdmin) return matchesSearch;
    return matchesSearch && (i.status === InitiativeStatus.APPROVED || i.userId === user?.uid);
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCredentials.username.toLowerCase() === 'admin' && adminCredentials.password === '1234') {
      setIsAdmin(true);
      setIsAdminLoginOpen(false);
      setView(View.ADMIN);
    } else {
      alert('Credenciales incorrectas');
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        console.log("Logged in UID:", u.uid);
        // Check if user is admin
        try {
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          const isEmailAdmin = u.email === 'joseacostafilms@gmail.com';
          setIsAdmin(adminDoc.exists() || isEmailAdmin);
        } catch (error) {
          console.error("Error checking admin status:", error);
          const isEmailAdmin = u.email === 'joseacostafilms@gmail.com';
          setIsAdmin(isEmailAdmin);
        }

        // Sync user profile to Firestore
        setDoc(doc(db, 'users', u.uid), {
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        setView(View.MAP); // Reset view on logout
        setIsAdmin(false); // Reset admin state on logout
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let q;
    if (isAdmin && user) {
      // Real admins (logged with Google) see everything
      q = query(collection(db, 'initiatives'), orderBy('createdAt', 'desc'));
    } else if (isAdmin && !user) {
      // Pseudo-admin (Admin/1234 but no Google login)
      // They can only see what a guest sees because rules won't allow more
      q = query(
        collection(db, 'initiatives'), 
        where('status', '==', InitiativeStatus.APPROVED)
      );
    } else if (user) {
      // Logged users see approved ones OR their own
      q = query(
        collection(db, 'initiatives'), 
        or(
          where('status', '==', InitiativeStatus.APPROVED),
          where('userId', '==', user.uid)
        )
      );
    } else {
      // Guests only see approved ones
      q = query(
        collection(db, 'initiatives'), 
        where('status', '==', InitiativeStatus.APPROVED)
      );
    }

    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Initiative));
      setInitiatives(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'initiatives');
      setLoading(false);
    });

    return () => unsubscribeFirestore();
  }, [user, isAdmin]);

  const handleFirestoreError = (error: unknown, operationType: FirestoreErrorInfo['operationType'], path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSaveInitiative = async (data: any) => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (editingInitiative) {
        await setDoc(doc(db, 'initiatives', editingInitiative.id), {
          ...editingInitiative,
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        alert('¡Iniciativa actualizada con éxito!');
      } else {
        await addDoc(collection(db, 'initiatives'), {
          ...data,
          userId: user.uid,
          status: InitiativeStatus.PENDING,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        alert('¡Iniciativa registrada con éxito! Estará visible una vez que sea aprobada por un administrador.');
      }
      setIsFormOpen(false);
      setEditingInitiative(null);
    } catch (error) {
      handleFirestoreError(error, editingInitiative ? 'update' : 'create', 'initiatives');
      alert('Error al guardar la iniciativa. Verifica los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-brand-light">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-brand-primary"
        >
          <Database size={48} />
        </motion.div>
        <p className="text-brand-primary font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Cargando Iniciativas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar 
        user={user} 
        isAdmin={isAdmin} 
        view={view}
        onAdminClick={() => isAdmin ? setView(View.ADMIN) : setIsAdminLoginOpen(true)} 
        onRegisterClick={() => setIsFormOpen(true)}
        onLogoClick={() => setView(View.MAP)}
      />

      {view !== View.ADMIN && (
        <Hero onSearch={(q) => q === 'register' ? setIsFormOpen(true) : setSearchQuery(q)} />
      )}

      <main className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {view === View.ADMIN ? (
          <div className="mb-24">
            <AdminPanel 
              onClose={() => setView(View.MAP)} 
              user={user}
              isAdmin={isAdmin}
            />
          </div>
        ) : (
          <>
            <HowItWorks />

            <ImpactStats />
            
            <section id="explorer-section" className={`flex-1 relative flex flex-col lg:flex-row gap-6 mb-12 scroll-mt-24 transition-all duration-500 ${isMapFullscreen ? 'fixed inset-0 z-[150] bg-white !m-0 !p-6' : ''}`}>
              <AnimatePresence mode="wait">
                {view === View.MAP ? (
                  <motion.div 
                    key="map-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-[600px]"
                  >
                    {/* Sidebar List */}
                    <motion.div 
                      initial={false}
                      animate={{ width: isSidebarOpen ? '380px' : '0px', opacity: isSidebarOpen ? 1 : 0 }}
                      className="hidden lg:flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative"
                    >
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Filter size={16} className="text-brand-primary" /> Directorio
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredInitiatives.length} Resultados</p>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                          <ChevronLeft size={20} />
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {filteredInitiatives.map(initiative => (
                          <div 
                            key={initiative.id}
                            className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${selectedInitiative?.id === initiative.id ? 'border-brand-primary bg-brand-light font-medium' : 'border-slate-100 hover:border-brand-primary/30 hover:bg-slate-50'}`}
                          >
                            <div onClick={() => setSelectedInitiative(initiative)} className="cursor-pointer">
                              <div className="flex items-center gap-3 mb-2">
                                <img 
                                  src={`https://flagcdn.com/w20/${initiative.country.toLowerCase()}.png`} 
                                  alt="flag" 
                                  className="w-5 h-auto rounded-sm"
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{initiative.category}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 line-clamp-1">{initiative.name}</h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{initiative.description}</p>
                            </div>
                            
                            {user?.uid === initiative.userId && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingInitiative(initiative);
                                  setIsFormOpen(true);
                                }}
                                className="absolute top-4 right-4 p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100"
                              >
                                 <ShieldCheck size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        {filteredInitiatives.length === 0 && (
                          <div className="text-center py-20">
                            <Database size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">No se encontraron iniciativas</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {!isSidebarOpen && (
                      <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-white p-3 rounded-r-2xl shadow-xl border border-slate-200 border-l-0 text-brand-primary hover:bg-brand-light transition-all"
                      >
                        <ChevronRight size={24} />
                      </button>
                    )}

                    {/* Map Area */}
                    <div className="flex-1 card relative overflow-hidden bg-slate-100">
                      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-4">
                         <div>
                           <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none">Explorador Global</p>
                           <p className="text-xs text-slate-500 font-semibold">{initiatives.length} Iniciativas activas</p>
                         </div>
                      </div>
                      
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                         <button 
                          onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                          className={`p-3 rounded-xl shadow-lg border transition-all ${isMapFullscreen ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white/90 backdrop-blur-md text-slate-600 border-slate-200'}`}
                          title={isMapFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                         >
                           <MapIcon size={20} />
                         </button>
                         <button 
                          onClick={() => setView(View.DASHBOARD)}
                          className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-brand-primary transition-colors"
                          title="Ver Dashboard"
                         >
                           <LayoutDashboard size={20} />
                         </button>
                      </div>

                      <AppMap 
                        initiatives={filteredInitiatives} 
                        onSelectInitiative={(i) => setSelectedInitiative(i)}
                        center={selectedInitiative ? [selectedInitiative.lat, selectedInitiative.lng] : undefined}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="dashboard-container"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-bold text-slate-800">Panel de Control</h2>
                      <button 
                        onClick={() => setView(View.MAP)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <MapIcon size={18} /> Volver al Mapa
                      </button>
                    </div>
                    <Dashboard 
                      initiatives={filteredInitiatives} 
                      user={user}
                      onAdd={() => setIsFormOpen(true)}
                      onSelect={(i) => {
                        setSelectedInitiative(i);
                        setView(View.MAP);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <VideoSection />

            <InitiativeGrid 
              initiatives={initiatives} 
              onSelect={(i) => setSelectedInitiative(i)} 
              currentUser={user}
              onEdit={(i) => {
                setEditingInitiative(i);
                setIsFormOpen(true);
              }}
            />

            <ImpactStats />

            <FAQSection />

            <CTASection onRegisterClick={() => setIsFormOpen(true)} />

            {!user && (
              <div className="mt-12 bg-white rounded-[4rem] p-4 shadow-sm border border-slate-100">
                <AuthHero onRegisterClick={() => setIsFormOpen(true)} />
              </div>
            )}
            
            <Footer />
          </>
        )}
      </main>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {isAdminLoginOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Acceso Admin</h3>
                <button onClick={() => setIsAdminLoginOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Usuario</label>
                  <input 
                    type="text" 
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="••••"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20"
                >
                  Ingresar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-slate-500 text-sm">© 2026 Idea Verde. Impulsando el cambio social y ecológico.</p>
          <div className="flex justify-center gap-6 text-slate-400">
            <Info size={18} className="cursor-pointer hover:text-brand-primary" />
            <Globe size={18} className="cursor-pointer hover:text-brand-primary" />
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <InitiativeForm 
              onSubmit={handleSaveInitiative} 
              onCancel={() => {
                setIsFormOpen(false);
                setEditingInitiative(null);
              }} 
              initialData={editingInitiative || undefined}
              user={user}
              isSubmitting={submitting}
              onLoginRequest={() => {
                setIsFormOpen(false);
                setEditingInitiative(null);
                handleLogin();
              }}
            />
          </div>
        )}

        {selectedInitiative && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedInitiative(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div id="initiative-detail-card" className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="relative h-64 bg-slate-900 overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10" />
                  <img 
                    src={`https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800&${selectedInitiative.id}`} 
                    alt={selectedInitiative.name}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute top-0 right-0 p-6 z-20">
                    <button onClick={() => setSelectedInitiative(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="absolute bottom-8 left-8 z-20 space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedInitiative.logoUrl && (
                        <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                          <img src={selectedInitiative.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <img 
                            src={`https://flagcdn.com/w80/${selectedInitiative.country.toLowerCase()}.png`} 
                            alt="flag" 
                            className="w-10 h-auto rounded shadow-lg border-2 border-white/20"
                          />
                          <span className="bg-brand-primary px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md">
                            {selectedInitiative.country}
                          </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">{selectedInitiative.name}</h2>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12 space-y-12 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-600">
                        <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-primary border border-brand-primary/10">
                          <MapPin size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ubicación</p>
                          <p className="text-base font-bold text-slate-800">{selectedInitiative.address || 'Latinoamérica'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-slate-600">
                        <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-primary border border-brand-primary/10">
                          <UserIcon size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Responsable</p>
                          <p className="text-base font-bold text-slate-800">{selectedInitiative.responsible1}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 text-slate-600">
                        <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-primary border border-brand-primary/10">
                          <Globe size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alcance</p>
                          <p className="text-base font-bold text-slate-800">{selectedInitiative.scope}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-slate-600">
                        <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-primary border border-brand-primary/10">
                          <Info size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Categoría</p>
                          <p className="text-base font-bold text-slate-800">{selectedInitiative.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b border-slate-100 pb-4">Impacto y Misión</h3>
                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                      {selectedInitiative.description}
                    </p>
                  </div>

                  {/* Project Gallery */}
                  {selectedInitiative.images && selectedInitiative.images.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b border-slate-100 pb-4">Galería del Proyecto</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {selectedInitiative.images.map((img: string, i: number) => (
                          <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-slate-100">
                             <img src={img} alt={`Impacto ${i}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b border-slate-100 pb-4">Canales de Contacto</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(selectedInitiative.website || selectedInitiative.mainProject) && (
                        <a href={(selectedInitiative.website || selectedInitiative.mainProject)!.startsWith('http') ? (selectedInitiative.website || selectedInitiative.mainProject) : `https://${selectedInitiative.website || selectedInitiative.mainProject}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-brand-primary hover:bg-brand-light transition-all group">
                          <Globe className="text-slate-400 group-hover:text-brand-primary" size={24} />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Web</p>
                            <p className="text-sm font-bold text-slate-800">Visitar Sitio</p>
                          </div>
                        </a>
                      )}
                      {selectedInitiative.email && (
                        <a href={`mailto:${selectedInitiative.email}`} className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-brand-primary hover:bg-brand-light transition-all group">
                          <Mail className="text-slate-400 group-hover:text-brand-primary" size={24} />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                            <p className="text-sm font-bold text-slate-800">Escribir ahora</p>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 shrink-0">
                <button 
                  onClick={() => exportToPDF(selectedInitiative)}
                  className="flex-1 flex items-center justify-center gap-3 py-5 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all shadow-sm"
                >
                  <Download size={18} /> Exportar Ficha PDF
                </button>
                <div className="flex gap-2">
                  {(selectedInitiative.website || selectedInitiative.mainProject) && (
                    <a 
                      href={(selectedInitiative.website || selectedInitiative.mainProject)!.startsWith('http') ? (selectedInitiative.website || selectedInitiative.mainProject) : `https://${selectedInitiative.website || selectedInitiative.mainProject}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20"
                    >
                      Visitar Web <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
