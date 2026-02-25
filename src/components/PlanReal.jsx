import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Save, Download, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import * as XLSX from 'xlsx';
import { dataService } from '../services/dataService';

/**
 * Aba Plan vs Real - Comparativo de Produção.
 */
export function PlanReal() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados ou houver atualização externa
  const loadData = async () => {
    setIsLoading(true);
    const savedData = await dataService.getPlanRealData(date);
    setData(savedData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = (e) => {
      if (!e.detail || (e.detail.type === 'planReal' && e.detail.date === date)) {
        loadData();
      }
    };
    window.addEventListener('data_updated', handleUpdate);
    return () => window.removeEventListener('data_updated', handleUpdate);
  }, [date]);

  const handleAddRow = () => {
    const newRow = {
      id: Math.random().toString(36).substring(7),
      data: date,
      produto: '',
      op: '',
      planBat: 0,
      realBat: 0,
    };
    setData([...data, newRow]);
  };

  const handleUpdateRow = (id, field, value) => {
    const updatedData = data.map(row => (row.id === id ? { ...row, [field]: value } : row));
    setData(updatedData);
    dataService.savePlanRealData(date, updatedData);
  };

  const handleRemoveRow = (id) => {
    if (confirm('Deseja remover este registro?')) {
      const updatedData = data.filter(row => row.id !== id);
      setData(updatedData);
      dataService.savePlanRealData(date, updatedData);
    }
  };

  const totalPlan = data.reduce((acc, curr) => acc + (Number(curr.planBat) || 0), 0);
  const totalReal = data.reduce((acc, curr) => acc + (Number(curr.realBat) || 0), 0);

  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.produto || item.op || 'Sem Nome',
      'Planejado': Number(item.planBat) || 0,
      'Realizado': Number(item.realBat) || 0,
    }));
  }, [data]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan vs Real");
    XLSX.writeFile(wb, `Plan_vs_Real_${date}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Seção de Tabela */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-lime-600" size={24} />
              <h2 className="font-black text-gray-800 uppercase tracking-tight">Lançamento</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportExcel} className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"><Download size={20} /></button>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50/30 border-b border-gray-100">
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-lime-500 font-bold text-gray-700 shadow-sm"
            />
          </div>

          <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#92d050] text-white sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs">Produto/OP</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-center">Plan</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-center">Real</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Sem registros</td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <input type="text" placeholder="Produto ou OP" value={row.produto} onChange={(e) => handleUpdateRow(row.id, 'produto', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-800" />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input type="number" value={row.planBat} onChange={(e) => handleUpdateRow(row.id, 'planBat', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0 text-sm font-black text-gray-700" />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input type="number" value={row.realBat} onChange={(e) => handleUpdateRow(row.id, 'realBat', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0 text-sm font-black text-lime-600" />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => handleRemoveRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-black border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 uppercase text-xs tracking-widest">Totais</td>
                  <td className="px-6 py-4 text-center text-xl">{totalPlan}</td>
                  <td className="px-6 py-4 text-center text-xl text-lime-600">{totalReal}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button onClick={handleAddRow} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-black hover:bg-gray-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-xs">
              <Plus size={18} /> Adicionar Linha
            </button>
          </div>
        </div>

        {/* Seção de Gráfico */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10 flex flex-col min-h-[500px]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Comparativo Planejado vs Realizado</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">{format(new Date(date), 'dd/MM/yyyy')}</p>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                barGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }} 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }} 
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px', fontWeight: 'bold', fontSize: '12px' }} />
                <Bar dataKey="Planejado" fill="#b2df8a" radius={[6, 6, 0, 0]} barSize={35}>
                  <LabelList dataKey="Planejado" position="top" style={{ fill: '#4d7c0f', fontSize: 11, fontWeight: '900' }} />
                </Bar>
                <Bar dataKey="Realizado" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={35}>
                  <LabelList dataKey="Realizado" position="top" style={{ fill: '#1d4ed8', fontSize: 11, fontWeight: '900' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
