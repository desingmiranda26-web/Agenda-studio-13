import React from 'react';
import { ViewTab } from '../types/studio';

interface TopNavProps {
  activeTab: ViewTab;
  onChangeTab: (tab: ViewTab) => void;
  activeAlertsCount: number;
}

const NAV_ITEMS: { id: ViewTab; label: string }[] = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'nueva-cita', label: 'Nueva Cita' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'galeria', label: 'Galería' },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onChangeTab,
  activeAlertsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0925B8]/95 backdrop-blur-md border-b border-white/15">
      {/* Desktop 3-zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onChangeTab('agenda')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white rounded-lg"
          aria-label="Ir al inicio de 13 STUDIO"
        >
          <img
            src="/assets/aistudio/13_20261117_143945_0000_ec0bd860.png"
            alt="Logo 13 STUDIO"
            referrerPolicy="no-referrer"
            className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover border border-white/25 shrink-0"
          />
          <span className="font-display text-xl md:text-2xl font-bold tracking-wider text-[#FFFBF2] whitespace-nowrap shrink-0">
            13 STUDIO
          </span>
        </button>

        {/* Zone 2: Single-line desktop navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`relative py-2 px-1 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-white rounded ${
                  isActive
                    ? 'text-white'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {item.label}
                {item.id === 'agenda' && activeAlertsCount > 0 && (
                  <span className="ml-1.5 text-xs font-mono-num text-[#FFD5DA]">
                    ({activeAlertsCount})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E6192E] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onChangeTab('nueva-cita')}
            className="px-4 py-2 min-h-[40px] md:min-h-[42px] bg-[#E6192E] hover:bg-[#C91225] active:scale-[0.98] text-white text-xs md:text-sm font-bold tracking-wide rounded-xl shadow-md transition-all whitespace-nowrap shrink-0"
          >
            AGENDAR CITA
          </button>
        </div>
      </div>
    </header>
  );
};
