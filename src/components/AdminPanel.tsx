import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, orderBy, where } from 'firebase/firestore';
import { db, auth } from '@/src/lib/firebase';
import { User } from 'firebase/auth';
import { Initiative, InitiativeStatus } from '@/src/types';
import { Check, X, Edit2, Trash2, Filter, Search, Globe, Mail, MapPin, ChevronRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
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
      alert("No tienes permisos suficientes para cambiar el estado. Asegúrate de estar logueado con tu cuenta admin de Google.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta iniciativa permanentemente?")) return;
    try {
      await deleteDoc(doc(db, 'initiatives', id));
      alert("Iniciativa eliminada con éxito.");
    } catch (error) {
      console.error("Error deleting:", error);
      handleFirestoreError(error, 'delete' as any, `initiatives/${id}`);
      alert("Error al eliminar de la base de datos. Verifica tus permisos de administrador.");
    }
  };

  const handleFirestoreError = (error: unknown, operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write', path: string | null) => {
    const errInfo = {
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

  const handleEditSubmit = async (data: any) => {
    if (!editingInitiative) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'initiatives', editingInitiative.id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingInitiative(null);
      alert("Cambios guardados.");
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando Control Maestro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Mini Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Gestión de Iniciativas</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Filtrar por nombre, país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all font-medium text-sm"
          />
        </div>
        <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-full lg:w-auto overflow-x-auto">
          {(['all', ...Object.values(InitiativeStatus)] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === s ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {s === 'all' ? 'Todas' : s === InitiativeStatus.PENDING ? 'Pendientes' : s === InitiativeStatus.APPROVED ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      </div>

      {/* List Container */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((initiative) => (
          <motion.div 
            layout
            key={initiative.id}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-brand-primary/20 transition-all flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
              <img 
                src={initiative.logoUrl || `https://flagcdn.com/w80/${initiative.country.toLowerCase()}.png`} 
                className="w-full h-full object-cover"
                alt=""
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                  initiative.status === InitiativeStatus.APPROVED ? "bg-emerald-100 text-emerald-700" :
                  initiative.status === InitiativeStatus.PENDING ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                )}>
                  {initiative.status}
                </span>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{initiative.country} • {initiative.category}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-base truncate">{initiative.name}</h4>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {initiative.status !== InitiativeStatus.APPROVED && (
                <button 
                  onClick={() => handleStatusChange(initiative.id, InitiativeStatus.APPROVED)}
                  className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"
                  title="Aprobar"
                >
                  <Check size={18} />
                </button>
              )}
              {initiative.status !== InitiativeStatus.REJECTED && (
                <button 
                  onClick={() => handleStatusChange(initiative.id, InitiativeStatus.REJECTED)}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                  title="Rechazar"
                >
                  <X size={18} />
                </button>
              )}
              <button 
                onClick={() => setEditingInitiative(initiative)}
                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(initiative.id)}
                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                title="Eliminar permanentemente"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
             <AlertCircle size={32} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay iniciativas que coincidan</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingInitiative && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-hidden">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-[3rem] shadow-2xl">
              <InitiativeForm 
                initialData={editingInitiative}
                user={auth.currentUser}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingInitiative(null)}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
