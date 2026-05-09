import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Initiative, Scope } from '@/src/types';
import { X, MapPin, Send, Globe, Mail, ChevronRight, MousePointer2, Camera, Upload, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const initiativeSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  country: z.string().length(2, 'Código de país (2 letras)'),
  scope: z.nativeEnum(Scope),
  category: z.string().min(2, 'Categoría requerida'),
  address: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  responsible1: z.string().min(3, 'Responsable 1 requerido'),
  responsible2: z.string().optional(),
  socialFB: z.string().optional(),
  socialIG: z.string().optional(),
  socialTikTok: z.string().optional(),
  description: z.string().min(10, 'Descripción más detallada requerida'),
  mainProject: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof initiativeSchema>;

interface FormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  user: any;
  onLoginRequest?: () => void;
  initialData?: Partial<Initiative>;
  isSubmitting?: boolean;
}

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker position={position} />
  ) : null;
}

export default function InitiativeForm({ onSubmit, onCancel, user, onLoginRequest, initialData, isSubmitting }: FormProps) {
  const [step, setStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || null);
  const [projectImages, setProjectImages] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);

  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality to stay under Firestore 1MB limit for multiple images
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(file, 400, 400);
        setLogoPreview(compressed);
        setValue('logoUrl', compressed);
      } catch (err) {
        console.error("Logo upload error", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleProjectImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsUploading(true);
      const remainingSlots = 3 - projectImages.length;
      const filesToProcess = files.slice(0, remainingSlots);
      
      try {
        const compressedImages = await Promise.all(
          filesToProcess.map(file => compressImage(file))
        );
        const newImages = [...projectImages, ...compressedImages].slice(0, 3);
        setProjectImages(newImages);
        setValue('images', newImages);
      } catch (err) {
        console.error("Images upload error", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeProjectImage = (index: number) => {
    const newImages = projectImages.filter((_, i) => i !== index);
    setProjectImages(newImages);
    setValue('images', newImages);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue('logoUrl', undefined);
  };
  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<FormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: {
      scope: Scope.LOCAL,
      country: 'MX',
      lat: 23.6345,
      lng: -102.5528,
      ...initialData
    }
  });

  const nextStep = async () => {
    let fields: any[] = [];
    if (step === 1) fields = ['name', 'category'];
    if (step === 2) fields = ['country', 'scope', 'lat', 'lng'];
    if (step === 3) fields = ['email', 'responsible1'];
    
    const isValid = await trigger(fields);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const countryCode = watch('country');
  const lat = watch('lat');
  const lng = watch('lng');

  const handleMapClick = (pos: [number, number]) => {
    setValue('lat', pos[0]);
    setValue('lng', pos[1]);
  };

  const handleSearch = async () => {
    const address = watch('address');
    if (!address) return;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setValue('lat', parseFloat(lat));
        setValue('lng', parseFloat(lon));
      }
    } catch (error) {
      console.error("Error searching address:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
    >
      <div className="flex justify-between items-center mb-8 bg-white z-20 py-2 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Registrar Iniciativa</h2>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step === s ? "bg-brand-primary w-20" : step > s ? "bg-brand-accent/40" : "bg-slate-100")} />
            ))}
          </div>
        </div>
        <button onClick={onCancel} className="p-3 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all" id="close-form">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
        <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Identidad del Proyecto</h3>
                <p className="text-slate-500 text-sm">Cuéntanos cómo se llama tu iniciativa y en qué categoría encaja mejor.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Logo de la Iniciativa</label>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className={cn(
                        "w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                        logoPreview ? "border-brand-primary" : "border-slate-200 hover:border-brand-primary bg-slate-50"
                      )}>
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="text-slate-300" size={32} />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {logoPreview && (
                        <button 
                          type="button" 
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all text-sm font-bold text-slate-600">
                        <Upload size={16} /> 
                        {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium">Recomendado: Cuadrado, PNG o JPG</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre de la Iniciativa</label>
                    <input 
                      {...register('name')}
                      placeholder="Ej: Reforesta Ciudad"
                      className={cn("w-full p-4 rounded-2xl border bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all", errors.name ? "border-red-500" : "border-slate-100 focus:border-brand-primary")}
                    />
                    {errors.name && <p className="text-xs text-red-500 font-medium px-2">{errors.name.message}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
                  <input 
                    {...register('category')}
                    placeholder="Ej: Conservación, Educación, Energía"
                    className={cn("w-full p-4 rounded-2xl border bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all", errors.category ? "border-red-500" : "border-slate-100 focus:border-brand-primary")}
                  />
                  {errors.category && <p className="text-xs text-red-500 font-medium px-2">{errors.category.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Ubicación Estratégica</h3>
                <p className="text-slate-500 text-sm">Indica dónde se desarrolla la iniciativa para que otros puedan encontrarla.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">País (ISO)</label>
                  <div className="relative">
                    <input 
                      {...register('country')}
                      maxLength={2}
                      className={cn("w-full p-4 rounded-2xl border bg-slate-50 uppercase focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all", errors.country ? "border-red-500" : "border-slate-100 focus:border-brand-primary")}
                    />
                    {countryCode && (
                       <img 
                       src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`} 
                       alt="flag" 
                       className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-auto rounded shadow-sm"
                     />
                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alcance</label>
                  <select 
                    {...register('scope')}
                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none"
                  >
                    {Object.values(Scope).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                 <div className="h-64 w-full mb-6 z-10 rounded-3xl overflow-hidden border border-slate-200 shadow-inner">
                    <MapContainer center={[lat, lng]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={[lat, lng]} setPosition={handleMapClick} />
                    </MapContainer>
                 </div>
                 <div className="flex gap-2">
                   <input {...register('address')} placeholder="Buscar dirección o referencia..." className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-brand-primary/10" />
                   <button type="button" onClick={handleSearch} className="px-8 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">Buscar</button>
                 </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Contacto y Redes</h3>
                <p className="text-slate-500 text-sm">¿Cómo pueden ponerse en contacto con la iniciativa?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email de Contacto</label>
                  <input {...register('email')} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teléfono / WhatsApp</label>
                  <input {...register('phone')} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Responsable</label>
                  <input {...register('responsible1')} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sitio Web</label>
                  <input {...register('website')} placeholder="https://..." className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Instagram / Redes</label>
                  <input {...register('socialIG')} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facebook / TikTok</label>
                  <input {...register('socialFB')} className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Detalles Finales</h3>
                <p className="text-slate-500 text-sm">Cuéntanos el impacto real de tu proyecto.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Fotos del Proyecto (Máx. 3)</label>
                  <p className="text-slate-500 text-sm">Agrega imágenes que muestren la labor de la iniciativa.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projectImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={img} className="w-full h-full object-cover" alt={`Project ${idx + 1}`} />
                      <button 
                        type="button"
                        onClick={() => removeProjectImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {projectImages.length < 3 && (
                    <label className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-all">
                        <Upload size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-primary transition-all">Subir Foto</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleProjectImagesUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descripción del Impacto</label>
                <textarea 
                  {...register('description')} 
                  rows={8}
                  className="w-full p-5 rounded-[2rem] border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-brand-primary/10 outline-none"
                  placeholder="Explica tu misión, visión y los logros alcanzados..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <div className="flex gap-4 pt-10 border-t border-slate-100 items-center justify-between bg-white py-4">
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                type="button" 
                onClick={prevStep}
                className="px-8 py-4 text-slate-400 font-bold hover:text-brand-primary transition-colors uppercase tracking-[0.2em] text-[10px]"
              >
                Atrás
              </button>
            )}
            {step === 1 && (
               <button 
               type="button" 
               onClick={onCancel}
               className="px-8 py-4 text-slate-400 font-bold hover:text-red-500 transition-colors uppercase tracking-[0.2em] text-[10px]"
             >
               Cancelar
             </button>
            )}
          </div>
          
          <div className="flex gap-4">
            {step < 4 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3"
              >
                Siguiente <ChevronRight size={20} />
              </button>
            ) : (
              user ? (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-12 py-5 bg-brand-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-brand-secondary transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/20"
                >
                  {isSubmitting ? "Registrando..." : <><Send size={18} /> Registrar Iniciativa</>}
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={onLoginRequest}
                  className="px-10 py-5 bg-brand-secondary text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-brand-primary transition-all flex items-center justify-center gap-3"
                >
                  Iniciar Sesión para Registrar <ChevronRight size={18} />
                </button>
              )
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
}
