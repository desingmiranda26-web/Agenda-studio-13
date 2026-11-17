import React from 'react';
import { CalendarDays, PlusCircle, Sparkles, Images } from 'lucide-react';
import { ViewTab } from '../types/studio';

interface MobileBottomNavProps {
  activeTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  activeAlertsCount: number;
}

const TABS: {
  id: ViewTab;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { id: 'nueva-cita', label: 'Nueva Cita', Icon: PlusCircle },
  { id: 'servicios', label: 'Servicios', Icon: Sparkles },
  { id: 'galeria', label: 'Galería', Icon: Images },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  activeAlertsCount,
}) => {
  return (
    <nav
      aria-label="Barra de navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFBF2]/95 backdrop-blur-md border-t border-[#0A1445]/15 pb-safe shadow-[0_-6px_20px_rgba(9,37,184,0.22)]"
    >
      <div className="grid grid-cols-4 items-center h-16">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] h-full px-1 transition-colors ${
                isActive
                  ? 'text-[#E6192E]'
                  : 'text-[#0A1445]/70 hover:text-[#0A1445]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 w-8 h-1 rounded-b-full bg-[#E6192E]"
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {id === 'agenda' && activeAlertsCount > 0 && (
                  <span
                    aria-label={`${activeAlertsCount} alertas activas`}
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E6192E] text-white text-[10px] font-mono-num font-bold flex items-center justify-center"
                  >
                    {activeAlertsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold tracking-tight mt-0.5 whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
