import React from 'react';
import {
  Users,
  Contact,
  ShoppingBag,
  ShieldAlert,
  Database,
} from 'lucide-react';

interface AppQuBottomNavProps {
  activeModule: 'paguyuban' | 'warga' | 'usaha' | 'siaga' | 'arsitektur';
  onSelectModule: (module: 'paguyuban' | 'warga' | 'usaha' | 'siaga' | 'arsitektur') => void;
  pendingApprovalsCount?: number;
  activeEmergencyCount?: number;
}

export const AppQuBottomNav: React.FC<AppQuBottomNavProps> = ({
  activeModule,
  onSelectModule,
  pendingApprovalsCount = 0,
  activeEmergencyCount = 0,
}) => {
  const tabs = [
    {
      id: 'paguyuban' as const,
      label: 'PaguyubanQu',
      icon: Users,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      sublabel: 'Sosial & Kas',
    },
    {
      id: 'warga' as const,
      label: 'WargaQu',
      icon: Contact,
      badge: null,
      sublabel: 'Buku Induk',
    },
    {
      id: 'usaha' as const,
      label: 'UsahaQu',
      icon: ShoppingBag,
      badge: 'BaksoQu',
      badgeColor: 'bg-amber-600',
      sublabel: 'Lapak & POS',
    },
    {
      id: 'siaga' as const,
      label: 'SiagaQu',
      icon: ShieldAlert,
      badge: activeEmergencyCount > 0 ? 'SOS' : null,
      badgeColor: 'bg-red-600',
      sublabel: 'Darurat & Ronda',
    },
    {
      id: 'arsitektur' as const,
      label: 'Arsitektur',
      icon: Database,
      badge: null,
      sublabel: 'DB & API',
    },
  ];

  return (
    <nav className="w-full bg-stone-900 border-t border-stone-800 text-stone-400 px-1.5 py-1.5 flex items-center justify-around shrink-0 z-30 shadow-xl select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeModule === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (navigator.vibrate) {
                try {
                  navigator.vibrate(20);
                } catch {}
              }
              onSelectModule(tab.id);
            }}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
              isActive
                ? 'text-emerald-400 font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {/* Top Active Indicator */}
            {isActive && (
              <span className="absolute -top-1.5 w-7 h-0.5 bg-emerald-400 rounded-full"></span>
            )}

            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 text-emerald-400' : 'text-stone-400'
                }`}
              />

              {tab.badge && (
                <span
                  className={`absolute -top-1 -right-3 text-white text-[8px] font-bold px-1 py-0.2 rounded-full flex items-center justify-center ring-1 ring-stone-900 ${
                    tab.badgeColor ? tab.badgeColor : 'bg-red-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-0.5 tracking-tight leading-none">
              {tab.label}
            </span>
            <span className="text-[8px] text-stone-400 font-normal leading-none mt-0.5">
              {tab.sublabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
