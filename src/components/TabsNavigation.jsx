import React from 'react';
import { LayoutDashboard, FileSpreadsheet, Calendar, BarChart3, Activity } from 'lucide-react';
import { cn } from '../utils';

/**
 * Componente de navegação por abas.
 */
export function TabsNavigation({ activeTab, onChange }) {
  const tabs = [
    { id: 'inicio', label: 'Início', icon: LayoutDashboard },
    { id: 'producao', label: 'Produção Diária', icon: FileSpreadsheet },
    { id: 'mensal', label: 'Mensal', icon: Calendar },
    { id: 'planReal', label: 'Plan vs Real', icon: BarChart3 },
    { id: 'relatorio', label: 'Mensal P2', icon: FileSpreadsheet },
    { id: 'paradas', label: 'Paradas', icon: Activity },
  ];

  return (
    <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap",
              isActive 
                ? "border-lime-500 text-lime-600 bg-lime-50/30" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50"
            )}
          >
            <Icon size={18} className={isActive ? "text-lime-600" : "text-gray-400"} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
