import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle2, Package, Scale, ArrowRight, Activity, Target, Zap } from 'lucide-react';

/**
 * Aba de Início - Dashboard Interativo.
 */
export function Inicio({ data, date, onNavigate }) {
  // Cálculos básicos
  const totalProduzido = data.reduce((acc, curr) => acc + (Number(curr.produzido) || 0), 0);
  const totalSobrepeso = data.reduce((acc, curr) => acc + (Number(curr.sobrepeso) || 0), 0);
  const percentual = totalProduzido > 0 ? (totalSobrepeso / totalProduzido) * 100 : 0;

  // Lógica de Status
  let status = {
    message: "Aguardando dados de produção...",
    icon: Activity,
    color: "text-blue-500",
    bg: "bg-blue-50/90",
    border: "border-blue-200",
    description: "Selecione uma data ou adicione novos registros na aba de Produção."
  };

  if (totalProduzido > 0) {
    if (percentual > 2) {
      status = {
        message: "Atenção: Sobrepeso Elevado",
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50/90",
        border: "border-red-200",
        description: "O índice de sobrepeso está em " + percentual.toFixed(2) + "%, acima da meta de 2%."
      };
    } else {
      status = {
        message: "Produção em Conformidade",
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50/90",
        border: "border-emerald-200",
        description: "Excelente! O índice de sobrepeso está dentro da meta operacional."
      };
    }
  }

  const StatusIcon = status.icon;

  return (
    <div className="relative min-h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
      {/* Imagem de Fundo com Filtros */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
        style={{ 
          backgroundImage: 'url("https://picsum.photos/seed/factory/1920/1080")',
          filter: 'brightness(0.4) contrast(1.1)'
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Conteúdo Principal */}
      <div className="relative z-20 p-8 md:p-16 h-full flex flex-col justify-between min-h-[650px]">
        
        {/* Cabeçalho do Dashboard */}
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="px-4 py-1.5 bg-lime-500/20 backdrop-blur-md border border-lime-500/30 rounded-full text-lime-400 text-xs font-bold uppercase tracking-widest">
              Sistema de Monitoramento v2.0
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[0.9]"
          >
            CONTROLE <br />
            <span className="text-lime-400">INTELIGENTE</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 mb-10 max-w-xl leading-relaxed font-medium"
          >
            Análise de rendimento e gestão de sobrepeso em tempo real. Transformando dados brutos em decisões precisas.
          </motion.p>
          
          {/* Card de Status Dinâmico */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center gap-6 backdrop-blur-xl border ${status.border} ${status.bg} ${status.color} shadow-2xl`}
          >
            <div className={`p-4 rounded-2xl bg-white/50 shadow-inner`}>
              <StatusIcon size={40} />
            </div>
            <div>
              <h3 className="font-black text-2xl mb-1 uppercase tracking-tight">{status.message}</h3>
              <p className="text-sm font-semibold opacity-80">{status.description}</p>
            </div>
            <div className="md:ml-auto">
               <button 
                onClick={() => onNavigate('producao')}
                className="flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white text-gray-900 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
               >
                 Ver Detalhes <ArrowRight size={18} />
               </button>
            </div>
          </motion.div>
        </div>

        {/* Grid de Métricas Inferiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <MetricCard 
            icon={Package} 
            label="Produção Total" 
            value={totalProduzido.toLocaleString()} 
            unit="kg" 
            color="lime" 
            onClick={() => onNavigate('producao')}
          />
          <MetricCard 
            icon={Scale} 
            label="Sobrepeso" 
            value={totalSobrepeso.toLocaleString()} 
            unit="kg" 
            color="red" 
            onClick={() => onNavigate('producao')}
          />
          <MetricCard 
            icon={Target} 
            label="Eficiência" 
            value={percentual.toFixed(2)} 
            unit="%" 
            color="blue" 
            onClick={() => onNavigate('planReal')}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Sub-componente para os cards de métricas.
 */
function MetricCard({ icon: Icon, label, value, unit, color, onClick }) {
  const colors = {
    lime: "bg-lime-500/10 border-lime-500/20 text-lime-400 group-hover:bg-lime-500/20",
    red: "bg-red-500/10 border-red-500/20 text-red-400 group-hover:bg-red-500/20",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500/20"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-black/40 backdrop-blur-xl p-8 rounded-[2rem] border ${colors[color]} transition-all cursor-pointer group relative overflow-hidden`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${colors[color]} transition-colors`}>
          <Icon size={28} />
        </div>
        <Zap size={20} className="text-white/20 group-hover:text-white/60 transition-colors" />
      </div>
      <h3 className="text-white/60 font-bold text-sm uppercase tracking-widest mb-2">{label}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-white tracking-tighter">{value}</span>
        <span className="text-lg font-bold text-white/40">{unit}</span>
      </div>
      
      {/* Efeito Visual de Hover */}
      <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight size={24} className="text-white/40" />
      </div>
    </motion.div>
  );
}
