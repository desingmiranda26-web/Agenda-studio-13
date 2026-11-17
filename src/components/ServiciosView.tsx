import React from 'react';
import { Check, Clock, Sparkles } from 'lucide-react';
import { STUDIO_RULES } from '../data/studioData';
import { ServiceCategory, ServiceItem } from '../types/studio';
import { formatCurrency } from '../utils/studioLogic';
import { StarAccent } from './StarAccent';

interface ServiciosViewProps {
  servicesCatalog: ServiceItem[];
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
  onProceedToBook: (singleServiceId?: string) => void;
}

const CATEGORY_META: {
  id: ServiceCategory;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'cejas',
    title: 'CEJAS',
    subtitle: 'Diseño personalizado, tinte y laminado de alta duración',
  },
  {
    id: 'pestanas',
    title: 'PESTAÑAS',
    subtitle: 'Aplicación punto por punto con acabado limpio y ligero',
  },
  {
    id: 'depilacion',
    title: 'DEPILACIÓN · DEPI SIN DRAMA',
    subtitle: 'Sesiones rápidas con piel cuidada y cero irritación',
  },
];

export const ServiciosView: React.FC<ServiciosViewProps> = ({
  servicesCatalog,
  selectedServiceIds,
  onToggleService,
  onProceedToBook,
}) => {
  const selectedTotal = servicesCatalog
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white/90">
            <StarAccent size={14} className="text-white" />
            <span>TARIFARIO OFICIAL</span>
            <StarAccent size={14} className="text-[#E6192E]" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#FFFBF2] mt-1 leading-none">
            MENÚ DE SERVICIOS
          </h2>
          <p className="text-sm text-white/85 mt-2 max-w-xl">
            Selecciona uno o varios servicios para calcular el total y llevarlos directo a Nueva Cita.
          </p>
        </div>

        {selectedServiceIds.length > 0 && (
          <button
            type="button"
            onClick={() => onProceedToBook()}
            className="min-h-[48px] px-5 py-3 rounded-2xl bg-[#E6192E] hover:bg-[#C91225] text-white text-sm font-extrabold tracking-wide shadow-lg flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
          >
            <span>
              AGENDAR ({selectedServiceIds.length}) ·{' '}
              {formatCurrency(selectedTotal)}
            </span>
          </button>
        )}
      </div>

      {/* Category Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {CATEGORY_META.map((cat) => {
          const items = servicesCatalog.filter((s) => s.category === cat.id);
          return (
            <section
              key={cat.id}
              aria-label={cat.title}
              className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-white space-y-4"
            >
              <div className="border-b border-[#0A1445]/10 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0F38F5]">
                    {cat.title}
                  </h3>
                  <StarAccent size={16} className="text-[#E6192E]" />
                </div>
                <p className="text-xs text-[#0A1445]/70 mt-1">{cat.subtitle}</p>
              </div>

              <div className="space-y-3">
                {items.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`rounded-2xl p-4 border transition-all ${
                        isSelected
                          ? 'bg-[#EEF2FF] border-[#0F38F5]'
                          : 'bg-[#F5EFE0]/60 border-[#0A1445]/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-base font-extrabold text-[#0A1445]">
                            {service.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-[#0A1445]/75 mt-0.5">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#0A1445]/60 mt-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-mono-num">
                              {service.durationMinutes} min aprox.
                            </span>
                          </div>
                        </div>
                        <span className="font-display text-3xl font-bold font-mono-num text-[#E6192E] shrink-0">
                          {service.price}$
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#0A1445]/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleService(service.id)}
                          aria-pressed={isSelected}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                            isSelected
                              ? 'bg-[#0F38F5] text-white'
                              : 'bg-white text-[#0A1445] border border-[#0A1445]/15 hover:bg-[#0A1445]/5'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Seleccionado</span>
                            </>
                          ) : (
                            <span>Añadir al turno</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onProceedToBook(service.id)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#E6192E] hover:bg-[#C91225] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Agendar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Institutional Rules & Motto Block */}
      <section className="bg-[#0925B8] border border-white/25 rounded-3xl p-6 text-[#FFFBF2]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-wide flex items-center gap-2">
              <StarAccent size={16} className="text-[#E6192E]" />
              <span>POLÍTICAS Y NORMAS DEL ESTUDIO</span>
            </h3>
            <ul className="space-y-2 text-sm text-white/90">
              {STUDIO_RULES.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-num font-bold text-[#FFD5DA]">
                    0{idx + 1}.
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl px-6 py-5 text-center shrink-0">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#E6192E]">
              &ldquo;Tu mirada, tus reglas.&rdquo;
            </p>
            <p className="text-xs font-bold tracking-widest uppercase text-[#0F38F5] mt-1">
              13 STUDIO · MIRADA ON POINT.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
