import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, orderBy, where } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { User } from 'firebase/auth';
import { Initiative, InitiativeStatus } from '@/src/types';
import { Check, X, Edit2, Trash2, Filter, Search, Globe, Mail, MapPin, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import InitiativeForm from './InitiativeForm';

interface AdminPanelProps {
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
}

export default function AdminPanel({ onClose, user, isAdmin }: AdminPanelProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InitiativeStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    // Si el usuario es un pseudo-admin (Admin/1234 sin login de Google),
    // intentamos ver los aprobados primero para no dar error de permisos
    let q;
    if (isAdmin && user) {
      q = query(collection(db, 'initiatives'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'initiatives'), where('status', '==', InitiativeStatus.APPROVED));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Initiative));
      setInitiatives(data);
      setLoading(false);
    }, (error) => {
      console.error("Admin snapshot error:", error);
      // Si falla por permisos siendo isAdmin, probablemente es porque falta el login de Google o no está en la colección admins
      if (error.message.includes('permission')) {
        alert("Error de permisos: Asegúrate de haber iniciado sesión con Google y estar registrado como Admin real en Firestore.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, user]);

  const handleStatusChange = async (id: string, status: InitiativeStatus) => {
    try {
      await updateDoc(doc(db, 'initiatives', id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar estado. Revisa los permisos.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta iniciativa permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'initiatives', id));
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar.");
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingInitiative) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'initiatives', editingInitiative.id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingInitiative(null);
    } catch (error) {
      console.error("Error updating initiative:", error);
      alert("Error al guardar cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = initiatives.filter(i => {
    const matchesFilter = filter === 'all' || i.status === filter;
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          i.country.toLowerCase().includes(search.toLowerCase()) ||
                          i.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: initiatives.length,
    pending: initiatives.filter(i => i.status === InitiativeStatus.PENDING).length,
    approved: initiatives.filter(i => i.status === InitiativeStatus.APPROVED).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Panel Maestro</h2>
          <p className="text-slate-500 font-medium text-sm">Gestiona y modera la red global.</p>
        </div>
        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-800', bg: 'bg-slate-100' },
            { label: 'Pendientes', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Aprobadas', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s, i) => (
            <div key={i} className={cn("p-4 rounded-3xl border border-transparent transition-all", s.bg)}>
              <p className={cn("text-xs font-black uppercase tracking-widest opacity-60", s.color)}>{s.label}</p>
              <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:row items-center gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, país o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-[1.8rem] border border-slate-100 w-full md:w-auto overflow-x-auto">
          {(['all', ...Object.values(InitiativeStatus)] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === s ? "bg-white text-brand-primary shadow-sm ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {s === 'all' ? 'Todas' : s === InitiativeStatus.PENDING ? 'Pendientes' : s === InitiativeStatus.APPROVED ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Initiatives Table/List */}
      <div className="space-y-4">
        {filtered.map((initiative) => (
          <motion.div 
            layout
            key={initiative.id}
            className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:row items-center gap-6"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shrink-0">
              <img 
                src={initiative.logoUrl || `https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=200&${initiative.id}`} 
                className="w-full h-full object-cover"
                alt=""
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                  initiative.status === InitiativeStatus.APPROVED ? "bg-emerald-50 text-emerald-600" :
                  initiative.status === InitiativeStatus.PENDING ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                )}>
                  {initiative.status}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                  <img src={`https://flagcdn.com/w20/${initiative.country.toLowerCase()}.png`} className="w-3.5 h-auto rounded-sm" alt="" />
                  <span className="text-[9px] font-black text-slate-400 uppercase">{initiative.country}</span>
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{initiative.category}</span>
              </div>
              <h4 className="text-xl font-bold text-slate-800">{initiative.name}</h4>
              <p className="text-sm text-slate-500 font-medium line-clamp-1">{initiative.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {initiative.status !== InitiativeStatus.APPROVED && (
                <button 
                  onClick={() => handleStatusChange(initiative.id, InitiativeStatus.APPROVED)}
                  className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  title="Aprobar"
                >
                  <Check size={20} />
                </button>
              )}
              {initiative.status !== InitiativeStatus.REJECTED && (
                <button 
                  onClick={() => handleStatusChange(initiative.id, InitiativeStatus.REJECTED)}
                  className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  title="Rechazar"
                >
                  <X size={20} />
                </button>
              )}
              <button 
                onClick={() => setEditingInitiative(initiative)}
                className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Editar Global"
              >
                <Edit2 size={20} />
              </button>
              <button 
                onClick={() => handleDelete(initiative.id)}
                className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                title="Eliminar"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[4rem] border border-dashed border-slate-200">
             <Filter size={48} className="mx-auto text-slate-200 mb-6" />
             <h4 className="text-xl font-bold text-slate-800">No hay resultados</h4>
             <p className="text-slate-400 font-medium mt-2">Prueba ajustando los filtros o la búsqueda.</p>
          </div>
        )}
      </div>

      {/* Edit Modal Overlay */}
      <AnimatePresence>
        {editingInitiative && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-md">
            <InitiativeForm 
              initialData={editingInitiative}
              user={auth.currentUser}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingInitiative(null)}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
