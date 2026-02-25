import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInMinutes, parse } from 'date-fns';
import { Plus, Trash2, Save, Download, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import * as XLSX from 'xlsx';
import { dataService } from '../services/dataService';

/**
 * Componente de Card de Estatística.
 */
function StatCard({ label, value, unit = "", icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    lime: "bg-lime-50 border-lime-100 text-lime-600"
  };

  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} shadow-sm flex items-center gap-4 bg-white`}>
      <div className={`p-3 rounded-2xl ${colors[color]} bg-opacity-50`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
        <p className="text-2xl font-black tracking-tighter">{value}<span className="text-sm ml-1 opacity-40">{unit}</span></p>
      </div>
    </div>
  );
}

/**
 * Aba Paradas de Produção.
 */
export function Paradas() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const savedData = await dataService.getParadasData(date);
    setData(savedData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = (e) => {
      if (!e.detail || (e.detail.type === 'paradas' && e.detail.date === date)) {
        loadData();
      }
    };
    window.addEventListener('data_updated', handleUpdate);
    return () => window.removeEventListener('data_updated', handleUpdate);
  }, [date]);

  const handleAddRow = () => {
    const newRow = {
      id: Math.random().toString(36).substring(7),
      inicio: '00:00',
      termino: '00:00',
      motivo: '',
    };
    const updatedData = [...data, newRow];
    setData(updatedData);
    dataService.saveParadasData(date, updatedData);
  };

  const handleUpdateRow = (id, field, value) => {
    const updatedData = data.map(row => (row.id === id ? { ...row, [field]: value } : row));
    setData(updatedData);
    dataService.saveParadasData(date, updatedData);
  };

  const handleRemoveRow = (id) => {
    if (confirm('Remover parada?')) {
      const updatedData = data.filter(row => row.id !== id);
      setData(updatedData);
      dataService.saveParadasData(date, updatedData);
    }
  };

  // Cálculos de Tempo
  const stopsWithDuration = useMemo(() => {
    return data.map(row => {
      try {
        const start = parse(row.inicio, 'HH:mm', new Date());
        const end = parse(row.termino, 'HH:mm', new Date());
        let diff = differenceInMinutes(end, start);
        if (diff < 0) diff += 1440; // Caso passe da meia-noite
        return { ...row, duration: diff };
      } catch {
        return { ...row, duration: 0 };
      }
    });
  }, [data]);

  const totalStopsMinutes = stopsWithDuration.reduce((acc, curr) => acc + curr.duration, 0);
  const totalStopsFormatted = `${Math.floor(totalStopsMinutes / 60).toString().padStart(2, '0')}:${(totalStopsMinutes % 60).toString().padStart(2, '0')}:00`;

  // Dados para o Gráfico de Pizza
  const chartData = useMemo(() => {
    const motives = {};
    stopsWithDuration.forEach(stop => {
      if (stop.motivo) {
        motives[stop.motivo] = (motives[stop.motivo] || 0) + stop.duration;
      }
    });
    return Object.keys(motives).map(key => ({
      name: key,
      value: motives[key]
    }));
  }, [stopsWithDuration]);

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  // Estatísticas Adicionais (Simuladas/Calculadas baseadas na imagem)
  const stats = useMemo(() => {
    const totalAvailableMinutes = 13 * 60; // Exemplo: 13 horas disponíveis
    const realWorkingMinutes = totalAvailableMinutes - totalStopsMinutes;
    
    return {
      disponivel: "13:00:00",
      real: `${Math.floor(realWorkingMinutes / 60).toString().padStart(2, '0')}:${(realWorkingMinutes % 60).toString().padStart(2, '0')}:00`,
      parada: totalStopsFormatted,
      massas: 14, // Valor exemplo da imagem
      quilos: 6979, // Valor exemplo da imagem
      mediaReal: realWorkingMinutes > 0 ? (6979 / (realWorkingMinutes / 60)).toFixed(0) : 0,
      mediaPingando: 699.07 // Valor exemplo da imagem
    };
  }, [totalStopsMinutes, totalStopsFormatted]);

  return (
    <div className="space-y-8">
      {/* Grid de Estatísticas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Horário Disponível" value={stats.disponivel} icon={Clock} color="blue" />
        <StatCard label="Funcionamento Real" value={stats.real} icon={Activity} color="emerald" />
        <StatCard label="Tempo Total Parada" value={stats.parada} icon={AlertCircle} color="orange" />
        <StatCard label="Média kg/h (Real)" value={stats.mediaReal} unit="kg/h" icon={TrendingUp} color="lime" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tabela de Paradas */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Clock className="text-orange-500" size={24} />
              <h2 className="font-black text-gray-800 uppercase tracking-tight">Registro de Paradas</h2>
            </div>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700 text-sm"
            />
          </div>

          <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#92d050] text-white sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-center">Início</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-center">Término</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-center">Parada</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs">Motivo</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stopsWithDuration.map((row) => {
                  const durationFormatted = `${Math.floor(row.duration / 60).toString().padStart(2, '0')}:${(row.duration % 60).toString().padStart(2, '0')}:00`;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <input type="time" value={row.inicio} onChange={(e) => handleUpdateRow(row.id, 'inicio', e.target.value)} className="w-full bg-transparent border-none p-0 text-center focus:ring-0 font-bold" />
                      </td>
                      <td className="px-6 py-3">
                        <input type="time" value={row.termino} onChange={(e) => handleUpdateRow(row.id, 'termino', e.target.value)} className="w-full bg-transparent border-none p-0 text-center focus:ring-0 font-bold" />
                      </td>
                      <td className="px-6 py-3 text-center font-black text-orange-600">
                        {durationFormatted}
                      </td>
                      <td className="px-6 py-3">
                        <input type="text" placeholder="Motivo da parada" value={row.motivo} onChange={(e) => handleUpdateRow(row.id, 'motivo', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-gray-800" />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => handleRemoveRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-black border-t-2 border-gray-200">
                <tr>
                  <td colSpan="2" className="px-6 py-4 uppercase text-xs tracking-widest">Tempo Total de Parada</td>
                  <td className="px-6 py-4 text-center text-xl text-orange-600">{totalStopsFormatted}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button onClick={handleAddRow} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-black hover:bg-gray-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-xs">
              <Plus size={18} /> Registrar Parada
            </button>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10 flex flex-col min-h-[500px]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Distribuição de Paradas</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Análise por Motivo</p>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
