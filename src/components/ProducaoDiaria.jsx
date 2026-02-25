import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Download } from 'lucide-react';
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

/**
 * Componente da Aba de Produção Diária.
 */
export function ProducaoDiaria({ data, date, onUpdateRow, onRemoveRow, onAddRow }) {
  const [newCodigo, setNewCodigo] = useState('');
  const [newProduzido, setNewProduzido] = useState('');
  const [newSobrepeso, setNewSobrepeso] = useState('');

  const totalProduzido = data.reduce((acc, curr) => acc + (Number(curr.produzido) || 0), 0);
  const totalSobrepeso = data.reduce((acc, curr) => acc + (Number(curr.sobrepeso) || 0), 0);
  const totalPercentual = totalProduzido > 0 ? ((totalSobrepeso / totalProduzido) * 100).toFixed(2) : '0.00';

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newCodigo || !newProduzido || !newSobrepeso) return;
    onAddRow({
      codigo: newCodigo,
      produzido: Number(newProduzido),
      sobrepeso: Number(newSobrepeso),
    });
    setNewCodigo('');
    setNewProduzido('');
    setNewSobrepeso('');
  };

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

  const CustomLabelSobrepeso = (props) => {
    const { x, y, width, height, value, index } = props;
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-1 bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-black text-gray-800 uppercase tracking-tight">Lançamento Diário</h2>
          <button onClick={handleExportExcel} className="text-xs font-bold text-blue-600 hover:underline uppercase">Exportar</button>
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
                        <input type="text" value={row.codigo} onChange={(e) => onUpdateRow(row.id, 'codigo', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-gray-800" />
                      </td>
                      <td className="px-6 py-3">
                        <input type="number" value={row.produzido || ''} onChange={(e) => onUpdateRow(row.id, 'produzido', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right font-bold text-gray-700" />
                      </td>
                      <td className="px-6 py-3">
                        <input type="number" value={row.sobrepeso || ''} onChange={(e) => onUpdateRow(row.id, 'sobrepeso', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-right font-bold text-red-500" />
                      </td>
                      <td className="px-6 py-3 text-right font-black text-gray-900">{percentual}</td>
                      <td className="px-6 py-3 text-center">
                        <button onClick={() => onRemoveRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="Cód." value={newCodigo} onChange={(e) => setNewCodigo(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 outline-none font-bold" required />
              <input type="number" placeholder="Prod." value={newProduzido} onChange={(e) => setNewProduzido(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 outline-none font-bold" required />
              <input type="number" placeholder="Sobre." value={newSobrepeso} onChange={(e) => setNewSobrepeso(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-lime-500 outline-none font-bold" required />
            </div>
            <button type="submit" className="w-full bg-lime-500 hover:bg-lime-600 text-white py-3 rounded-xl transition-all font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <Plus size={18} /> Adicionar Código
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl border border-gray-100 p-10 flex flex-col min-h-[500px]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Análise de Rendimento Diário</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">{format(new Date(date), 'dd/MM/yyyy')}</p>
        </div>
        
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 40, right: 50, left: 20, bottom: 20 }} barSize={45}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} dy={15} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '30px', fontWeight: 'bold', fontSize: '12px' }} />
              <Bar dataKey="produzido" stackId="a" fill="#b2df8a" name="Produzido (kg)" radius={[0, 0, 8, 8]}>
                <LabelList content={<CustomLabelProduzido />} />
              </Bar>
              <Bar dataKey="sobrepeso" stackId="a" fill="#ef4444" name="Sobrepeso (kg)" radius={[8, 8, 0, 0]}>
                <LabelList content={<CustomLabelSobrepeso />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
