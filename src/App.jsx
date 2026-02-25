import socket from "./socket";
import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, FileSpreadsheet, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import { dataService } from './services/dataService';
import { TabsNavigation } from './components/TabsNavigation';
import { Inicio } from './components/Inicio';
import { Mensal } from './components/Mensal';
import { PlanReal } from './components/PlanReal';
import { Relatorio } from './components/Relatorio';
import { Paradas } from './components/Paradas';

// Labels customizadas para o gráfico
const CustomLabelSobrepeso = (props) => {
  const { x, y, width, height, value, index, chartData } = props;
  const dataItem = chartData[index];
  if (!dataItem) return null;

  const cx = x + width / 2;
  const cy = y;

  return (
    <g>
      {height > 10 && (
        <text x={cx} y={cy + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="bold">
          {value > 0 ? value : ''}
        </text>
      )}
      <path d={`M${cx},${cy} L${cx + 15},${cy - 15} L${cx + 35},${cy - 15}`} stroke="#ef4444" strokeWidth={1} fill="none" />
      <text x={cx + 38} y={cy - 15} fill="#ef4444" textAnchor="start" dominantBaseline="middle" fontSize={11} fontWeight="bold">
        {dataItem.percentual}%
      </text>
    </g>
  );
};

const CustomLabelProduzido = (props) => {
  const { x, y, width, height, value } = props;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return (
    <text x={cx} y={cy} fill="#1f2937" textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="bold">
      {value > 0 ? value : ''}
    </text>
  );
};

/**
 * Componente Principal da Aplicação.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(dataService.getConnectionStatus());
useEffect(() => {
  socket.on("connect", () => {
    console.log("conectado ao backend");
    setIsConnected(true);
  });
  socket.on("estado", (data) => {
  console.log("estado recebido:", data);
});
}, []);
  // Carregar dados quando a data mudar ou houver atualização externa
  const loadData = async () => {
    setIsLoading(true);
    const savedData = await dataService.getDataByDate(date);
    setData(savedData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Listener para atualizações em tempo real de outros usuários
    const handleUpdate = (e) => {
      const detail = e.detail;
      if (!detail) {
        loadData();
      } else if (detail.type === 'producao' && detail.date === date) {
        loadData();
      }
    };
    window.addEventListener('data_updated', handleUpdate);

    const handleConnectionChange = (e) => {
      setIsConnected(e.detail.connected);
    };
    window.addEventListener('connection_changed', handleConnectionChange);

    return () => {
      window.removeEventListener('data_updated', handleUpdate);
      window.removeEventListener('connection_changed', handleConnectionChange);
    };
  }, [date]);

  // Salvar dados sempre que houver alteração
  useEffect(() => {
    if (!isLoading) {
      dataService.saveDataByDate(date, data);
    }
  }, [data, date, isLoading]);

  const [newCodigo, setNewCodigo] = useState('');
  const [newProduzido, setNewProduzido] = useState('');
  const [newSobrepeso, setNewSobrepeso] = useState('');

  const handleAddRow = (e) => {
    e.preventDefault();
    if (!newCodigo || !newProduzido || !newSobrepeso) return;

    const newRow = {
      id: Math.random().toString(36).substring(7),
      codigo: newCodigo,
      produzido: Number(newProduzido),
      sobrepeso: Number(newSobrepeso),
    };

    setData([...data, newRow]);
    setNewCodigo('');
    setNewProduzido('');
    setNewSobrepeso('');
  };

  const handleRemoveRow = (id) => {
    if (confirm('Deseja remover este registro?')) {
      setData(data.filter(row => row.id !== id));
    }
  };

  const handleUpdateRow = (id, field, value) => {
    setData(data.map(row => {
      if (row.id === id) {
        return {
          ...row,
          [field]: field === 'codigo' ? value : Number(value) || 0
        };
      }
      return row;
    }));
  };

  const totalProduzido = data.reduce((acc, curr) => acc + (Number(curr.produzido) || 0), 0);
  const totalSobrepeso = data.reduce((acc, curr) => acc + (Number(curr.sobrepeso) || 0), 0);
  const totalPercentual = totalProduzido > 0 ? ((totalSobrepeso / totalProduzido) * 100).toFixed(2) : '0.00';

  const handleExportExcel = () => {
    const exportData = data.map(row => ({
      'Código': row.codigo,
      'Produzido (kg)': row.produzido,
      'Sobrepeso (kg)': row.sobrepeso,
      '%': row.produzido > 0 ? ((row.sobrepeso / row.produzido) * 100).toFixed(2) : '0.00'
    }));

    exportData.push({
      'Código': 'Total',
      'Produzido (kg)': totalProduzido,
      'Sobrepeso (kg)': totalSobrepeso,
      '%': totalPercentual
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produção Diária");
    XLSX.writeFile(wb, `Producao_${format(new Date(date), 'dd-MM-yyyy')}.xlsx`);
  };

  const chartData = useMemo(() => {
    const mapped = data.map(item => ({
      name: item.codigo,
      produzido: Number(item.produzido) || 0,
      sobrepeso: Number(item.sobrepeso) || 0,
      percentual: item.produzido > 0 ? ((item.sobrepeso / item.produzido) * 100).toFixed(2) : '0.00'
    }));

    mapped.push({
      name: 'Total',
      produzido: totalProduzido,
      sobrepeso: totalSobrepeso,
      percentual: totalPercentual
    });

    return mapped;
  }, [data, totalProduzido, totalSobrepeso, totalPercentual]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Cabeçalho Principal */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-lime-100 text-lime-600 rounded-2xl shadow-inner">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Controle de Produção</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gestão de Rendimento Industrial</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                    {isConnected ? 'Sincronizado' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-black text-xs uppercase tracking-widest active:scale-95"
            >
              <Download size={18} /> Excel
            </button>
            <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Data de Referência</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-all font-bold text-gray-700 bg-gray-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
          <TabsNavigation activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Conteúdo das Abas */}
        <div className="transition-all duration-300">
          {activeTab === 'inicio' && (
            <Inicio data={data} date={date} onNavigate={setActiveTab} />
          )}
          
          {activeTab === 'producao' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Tabela de Lançamento */}
              <div className="lg:col-span-1 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="font-black text-gray-800 uppercase tracking-tight">Lançamento Diário</h2>
                </div>
                
                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#92d050] text-white sticky top-0">
                      <tr>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-xs">Código</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-right">Prod.</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-right">Sobre.</th>
                        <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-right">%</th>
                        <th className="px-6 py-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Sem registros</td>
                        </tr>
                      ) : (
                        data.map((row) => {
                          const percentual = row.produzido > 0 ? ((row.sobrepeso / row.produzido) * 100).toFixed(2) : '0.00';
                          return (
                            <tr key={row.id} className="hover:bg-lime-50/30 transition-colors group">
                              <td className="px-6 py-3">
                                <input 
                                  type="text" 
                                  value={row.codigo}
                                  onChange={(e) => handleUpdateRow(row.id, 'codigo', e.target.value)}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-gray-800"
                                />
                              </td>
                              <td className="px-6 py-3">
                                <input 
                                  type="number" 
                                  value={row.produzido || ''}
                                  onChange={(e) => handleUpdateRow(row.id, 'produzido', e.target.value)}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right font-bold text-gray-700"
                                />
                              </td>
                              <td className="px-6 py-3">
                                <input 
                                  type="number" 
                                  value={row.sobrepeso || ''}
                                  onChange={(e) => handleUpdateRow(row.id, 'sobrepeso', e.target.value)}
                                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right font-bold text-red-500"
                                />
                              </td>
                              <td className="px-6 py-3 text-right font-black text-gray-900">
                                {percentual}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <button 
                                  onClick={() => handleRemoveRow(row.id)}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-6 py-4 uppercase text-xs tracking-widest">Total</td>
                        <td className="px-6 py-4 text-right">{totalProduzido.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-red-600">{totalSobrepeso.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">{totalPercentual}%</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Formulário de Adição */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <form onSubmit={handleAddRow} className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        placeholder="Cód." 
                        value={newCodigo}
                        onChange={(e) => setNewCodigo(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 outline-none font-bold"
                        required
                      />
                      <input 
                        type="number" 
                        placeholder="Prod." 
                        value={newProduzido}
                        onChange={(e) => setNewProduzido(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 outline-none font-bold"
                        required
                      />
                      <input 
                        type="number" 
                        placeholder="Sobre." 
                        value={newSobrepeso}
                        onChange={(e) => setNewSobrepeso(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 outline-none font-bold"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-lime-500 hover:bg-lime-600 text-white py-3 rounded-xl transition-all font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Adicionar Código
                    </button>
                  </form>
                </div>
              </div>

              {/* Gráfico Diário */}
              <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10 flex flex-col min-h-[500px]">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Análise de Rendimento Diário</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">{format(new Date(date), 'dd/MM/yyyy')}</p>
                </div>
                
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 40, right: 50, left: 20, bottom: 20 }}
                      barSize={45}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }}
                        dy={15}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '30px', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Bar dataKey="produzido" stackId="a" fill="#b2df8a" name="Produzido (kg)" radius={[0, 0, 8, 8]}>
                        <LabelList content={<CustomLabelProduzido />} />
                      </Bar>
                      <Bar dataKey="sobrepeso" stackId="a" fill="#ef4444" name="Sobrepeso (kg)" radius={[8, 8, 0, 0]}>
                        <LabelList content={<CustomLabelSobrepeso chartData={chartData} />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mensal' && (
            <Mensal />
          )}

          {activeTab === 'planReal' && (
            <PlanReal />
          )}

          {activeTab === 'relatorio' && (
            <Relatorio />
          )}

          {activeTab === 'paradas' && (
            <Paradas />
          )}
        </div>
      </div>
    </div>
  );
}
