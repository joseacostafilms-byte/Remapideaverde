import { useState } from 'react';
import { Initiative } from '@/src/types';
import { Search, MapPin, ExternalLink, Filter, TrendingUp, Globe, Users, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  initiatives: Initiative[];
  onSelect: (initiative: Initiative) => void;
  onAdd: () => void;
  user: any;
}

export default function Dashboard({ initiatives, onSelect, onAdd, user }: DashboardProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filtered = initiatives.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          i.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || i.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: initiatives.length,
    countries: new Set(initiatives.map(i => i.country)).size,
    categories: new Set(initiatives.map(i => i.category)).size,
    recent: initiatives.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)[0],
  };

  const categories = Array.from(new Set(initiatives.map(i => i.category)));

  return (
    <div className="space-y-8 pb-12">
      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[160px]">
        {/* Total Initiatives */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="card md:col-span-3 md:row-span-1 p-6 justify-center bg-white"
        >
          <span className="stats-label">Iniciativas</span>
          <span className="stats-value">{stats.total}</span>
          <span className="text-[11px] text-brand-accent font-semibold flex items-center gap-1">
            <TrendingUp size={12} /> Impacto Activo
          </span>
        </motion.div>

        {/* Countries */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }}
          className="card md:col-span-3 md:row-span-1 p-6 justify-center bg-white"
        >
          <span className="stats-label">Países</span>
          <span className="stats-value">{stats.countries}</span>
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Impacto Regional</span>
        </motion.div>

        {/* Popular Category (Featured Card) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.2 }}
          className="card md:col-span-6 md:row-span-1 p-6 justify-center bg-brand-secondary text-white"
        >
          <span className="stats-label !text-brand-accent">Categoría Popular</span>
          <div className="text-2xl font-bold mt-1">Reforestación Urbana</div>
          <p className="mt-2 text-xs opacity-80 leading-relaxed max-w-xs">
            La categoría con mayor crecimiento en el último trimestre.
          </p>
        </motion.div>

        {/* Recent Activity Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.3 }}
          className="card md:col-span-4 md:row-span-2 p-6 bg-white overflow-y-auto"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest border-b pb-2">Actividad Reciente</h3>
          <div className="space-y-4">
            {initiatives.slice(0, 5).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((i) => (
              <div key={i.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => onSelect(i)}>
                <img src={`https://flagcdn.com/w40/${i.country.toLowerCase()}.png`} className="w-6 h-auto rounded-sm shadow-sm" alt={i.country} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-700 truncate group-hover:text-brand-primary transition-colors">{i.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{i.category} • {i.scope}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Large List / Browser Section */}
        <div className="md:col-span-8 md:row-span-2 flex flex-col gap-4">
          {/* Internal Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar iniciativas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm"
              />
            </div>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-sm outline-none w-full sm:w-40"
            >
              <option value="">Categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {user && (
              <button 
                onClick={onAdd}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-secondary transition-all shadow-md shadow-brand-primary/10 whitespace-nowrap"
              >
                + Nueva
              </button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Explorador de Iniciativas</h3>
              <span className="text-[10px] text-slate-400 font-bold">{filtered.length} Resultados</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filtered.map((i) => (
                  <div 
                    key={i.id} 
                    onClick={() => onSelect(i)}
                    className="flex items-center gap-4 p-3 hover:bg-brand-light rounded-2xl cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-primary/10">
                      <Globe size={20} className="text-slate-400 group-hover:text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{i.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{i.category} • {i.country}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                  <Search size={32} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-tight">Sin resultados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
