import React, { useMemo, useState } from 'react';
import { CalendarPlus, Sparkles } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/studioData';
import { ServiceCategory, ServiceItem } from '../types/studio';
import { StarAccent } from './StarAccent';

interface GaleriaViewProps {
  servicesCatalog: ServiceItem[];
  onBookServiceFromGallery: (serviceId: string) => void;
}

const FILTERS: { id: 'todas' | ServiceCategory; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'cejas', label: 'Cejas' },
  { id: 'pestanas', label: 'Pestañas' },
  { id: 'depilacion', label: 'Depilación' },
];

export const GaleriaView: React.FC<GaleriaViewProps> = ({
  servicesCatalog,
  onBookServiceFromGallery,
}) => {
  const [filter, setFilter] = useState<'todas' | ServiceCategory>('todas');

  const serviceMap = useMemo(
    () => new Map(servicesCatalog.map((s) => [s.id, s])),
    [servicesCatalog]
  );

  const visibleItems = useMemo(() => {
    if (filter === 'todas') return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.category === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white/90">
            <StarAccent size={14} className="text-white" />
            <span>PORTAFOLIO 13 STUDIO</span>
            <StarAccent size={14} className="text-[#E6192E]" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#FFFBF2] mt-1 leading-none">
            GALERÍA DE RESULTADOS
          </h2>
          <p className="text-sm text-white/85 mt-2 max-w-xl">
            Trabajos reales del estudio. Filtra por categoría y preselecciona el servicio directo para tu próxima clienta.
          </p>
        </div>

        {/* Interactive Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filtrar galería por categoría"
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#0925B8] rounded-2xl border border-white/20"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#E6192E] text-white shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((item) => {
          const linkedService = serviceMap.get(item.linkedServiceId);
          return (
            <article
              key={item.id}
              className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl overflow-hidden shadow-xl border-2 border-white flex flex-col"
            >
              {/* Visual Frame */}
              <div className="relative h-64 bg-[#0925B8] overflow-hidden">
                {item.imageUrl ? (
                  <>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0A1445]/85 via-[#0A1445]/20 to-transparent"
                    />
                  </>
                ) : (
                  <div className="w-full h-full p-6 pb-12 flex flex-col justify-between bg-gradient-to-br from-[#0F38F5] to-[#0925B8] text-white">
                    <div className="flex items-center justify-between">
                      <StarAccent size={20} className="text-white" />
                      <Sparkles className="w-6 h-6 text-[#FFD5DA]" />
                    </div>
                    <div className="my-auto">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                        {item.category === 'pestanas'
                          ? 'Pestañas Punto a Punto'
                          : item.category === 'depilacion'
                            ? 'Depi Sin Drama'
                            : 'Visagismo de Cejas'}
                      </p>
                      <p className="font-display text-3xl font-bold mt-1 leading-tight">
                        13 STUDIO · MIRADA ON POINT
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-xs font-bold tracking-wide uppercase">
                    {item.category === 'depilacion'
                      ? 'Depilación'
                      : item.category === 'pestanas'
                        ? 'Pestañas'
                        : 'Cejas'}
                  </span>
                  <span className="font-mono-num text-xs font-bold">
                    {item.highlightTag}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#0A1445]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#0A1445]/75 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onBookServiceFromGallery(item.linkedServiceId)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E6192E] hover:bg-[#C91225] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>
                    Agendar{' '}
                    {linkedService ? `${linkedService.name} (${linkedService.price}$)` : 'este look'}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
