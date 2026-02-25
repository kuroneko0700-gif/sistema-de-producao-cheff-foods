import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Download, Save, Calendar, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dataService, PRODUCT_DATABASE } from '../services/dataService';

/**
 * Aba Mensal P2 - Fechamento de Indicadores (Segunda Parte/Linha).
 */
export function Relatorio() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const savedData = await dataService.getRelatorioData(month);
    setData(savedData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = (e) => {
      if (!e.detail || (e.detail.type === 'relatorio' && e.detail.month === month)) {
        loadData();
      }
    };
    window.addEventListener('data_updated', handleUpdate);
    return () => window.removeEventListener('data_updated', handleUpdate);
  }, [month]);

  const handleAddRow = () => {
    const newRow = {
      id: Math.random().toString(36).substring(7),
      data: format(new Date(), 'yyyy-MM-dd'),
      produto: '',
      op: '',
      planBat: 0,
      realBat: 0,
      reformaUtilizada: 0,
      caixasEmbaladas: 0,
      perdasKgDia: 0,
      reformasGeradas: 0,
      rendimentoEsperado: 0,
      rendimentoReal: 0,
      pesoMassa: 0,
      pesoCaixa: 0,
      pesoAlvoPacote: 0,
      pesoMedioPacotes: 0,
      perdasGPacote: 0,
      sobrepesoTotal: 0,
      sobrepesoPercent: 0,
      totalProduzido: 0
    };
    const updatedData = [...data, newRow];
    setData(updatedData);
    dataService.saveRelatorioData(month, updatedData);
  };

  const handleUpdateRow = (id, field, value) => {
    const updatedData = data.map(row => {
      if (row.id === id) {
        let updatedRow = { ...row, [field]: value };

        if (field === 'produto' && PRODUCT_DATABASE[value]) {
          const productInfo = PRODUCT_DATABASE[value];
          updatedRow.pesoMassa = productInfo.pesoMassa;
          updatedRow.pesoCaixa = productInfo.pesoCaixa;
          updatedRow.pesoAlvoPacote = productInfo.pesoAlvoPacote;
        }

        updatedRow.totalProduzido = (Number(updatedRow.caixasEmbaladas) || 0) * (Number(updatedRow.pesoCaixa) || 0);
        updatedRow.rendimentoEsperado = (Number(updatedRow.realBat) || 0) * (Number(updatedRow.pesoMassa) || 0);

        if (updatedRow.rendimentoEsperado > 0) {
          updatedRow.rendimentoReal = (updatedRow.totalProduzido / updatedRow.rendimentoEsperado) * 100;
        } else {
          updatedRow.rendimentoReal = 0;
        }

        updatedRow.perdasGPacote = (Number(updatedRow.pesoMedioPacotes) || 0) - (Number(updatedRow.pesoAlvoPacote) || 0);

        if (updatedRow.pesoAlvoPacote > 0) {
          const totalPacotes = updatedRow.totalProduzido / (updatedRow.pesoAlvoPacote / 1000);
          updatedRow.sobrepesoTotal = (updatedRow.perdasGPacote / 1000) * totalPacotes;
        } else {
          updatedRow.sobrepesoTotal = 0;
        }

        if (updatedRow.totalProduzido > 0) {
          updatedRow.sobrepesoPercent = (updatedRow.sobrepesoTotal / updatedRow.totalProduzido) * 100;
        } else {
          updatedRow.sobrepesoPercent = 0;
        }

        return updatedRow;
      }
      return row;
    });
    setData(updatedData);
    dataService.saveRelatorioData(month, updatedData);
  };

  const handleRemoveRow = (id) => {
    if (confirm('Remover registro?')) {
      const updatedData = data.filter(row => row.id !== id);
      setData(updatedData);
      dataService.saveRelatorioData(month, updatedData);
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mensal P2");
    XLSX.writeFile(wb, `Mensal_P2_${month}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
      <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-lime-100 text-lime-600 rounded-2xl">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Mensal P2</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Indicadores de Rendimento e Sobrepeso - Parte 2</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="month" 
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-lime-500 font-bold text-gray-700 bg-white shadow-sm"
          />
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95">
            <Download size={18} /> EXPORTAR
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300">
        <table className="w-full text-[10px] text-left border-collapse">
          <thead className="bg-[#92d050] text-white sticky top-0 z-10">
            <tr>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center min-w-[100px]">Data</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center min-w-[80px]">Produto</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center min-w-[80px]">OP</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Plan (bat)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Real (bat)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Reforma Util. (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Cx Embal.</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Total Prod (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Perdas (kg/dia)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Reformas Ger. (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Rend. Esp. (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Rend. Real (%)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Peso Massa (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Peso Caixa (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Peso Alvo (g)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Peso Médio (g)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Perdas (g/pac)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Sobrepeso Total (kg)</th>
              <th className="px-2 py-4 border border-lime-600 font-bold uppercase text-center">Sobrepeso (%)</th>
              <th className="px-2 py-4 border border-lime-600 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-lime-50/30 transition-colors">
                <td className="px-2 py-2 border border-gray-100">
                  <input type="date" value={row.data} onChange={(e) => handleUpdateRow(row.id, 'data', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 font-medium" />
                </td>
                <td className="px-2 py-2 border border-gray-100">
                  <div className="flex items-center gap-1">
                    <input type="text" value={row.produto} onChange={(e) => handleUpdateRow(row.id, 'produto', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-gray-800" />
                    {PRODUCT_DATABASE[row.produto] && <Search size={10} className="text-lime-400" />}
                  </div>
                </td>
                <td className="px-2 py-2 border border-gray-100">
                  <input type="text" value={row.op} onChange={(e) => handleUpdateRow(row.id, 'op', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.planBat} onChange={(e) => handleUpdateRow(row.id, 'planBat', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.realBat} onChange={(e) => handleUpdateRow(row.id, 'realBat', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0 text-lime-600 font-bold" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.reformaUtilizada} onChange={(e) => handleUpdateRow(row.id, 'reformaUtilizada', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.caixasEmbaladas} onChange={(e) => handleUpdateRow(row.id, 'caixasEmbaladas', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center font-bold text-gray-900">
                  {(Number(row.totalProduzido) || 0).toFixed(0)}
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.perdasKgDia} onChange={(e) => handleUpdateRow(row.id, 'perdasKgDia', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.reformasGeradas} onChange={(e) => handleUpdateRow(row.id, 'reformasGeradas', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center font-medium">
                  {(Number(row.rendimentoEsperado) || 0).toFixed(2)}
                </td>
                <td className={`px-2 py-2 border border-gray-100 text-center font-black ${row.rendimentoReal < 90 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {(row.rendimentoReal || 0).toFixed(2)}%
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.pesoMassa} onChange={(e) => handleUpdateRow(row.id, 'pesoMassa', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.pesoCaixa} onChange={(e) => handleUpdateRow(row.id, 'pesoCaixa', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.pesoAlvoPacote} onChange={(e) => handleUpdateRow(row.id, 'pesoAlvoPacote', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center">
                  <input type="number" value={row.pesoMedioPacotes} onChange={(e) => handleUpdateRow(row.id, 'pesoMedioPacotes', Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-center focus:ring-0 font-bold" />
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center font-bold text-orange-600">
                  {(Number(row.perdasGPacote) || 0).toFixed(1)}
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center font-black text-red-600">
                  {(Number(row.sobrepesoTotal) || 0).toFixed(1)}
                </td>
                <td className="px-2 py-2 border border-gray-100 text-center font-black text-red-600">
                  {(Number(row.sobrepesoPercent) || 0).toFixed(2)}%
                </td>
                <td className="px-2 py-2 text-center">
                  <button onClick={() => handleRemoveRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button onClick={handleAddRow} className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-2xl font-black hover:bg-gray-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-xs">
          <Plus size={20} /> Adicionar Registro
        </button>
      </div>
    </div>
  );
}
