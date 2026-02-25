import { io } from 'socket.io-client';

/**
 * Banco de Dados de Produtos (Baseado na imagem enviada)
 * Mapeamento:
 * Peso da Massa -> pesoMassa
 * Peso da Embal -> pesoCaixa (kg)
 * Peso de Caixa -> pesoAlvoPacote (g)
 */
export const PRODUCT_DATABASE = {
  "204": { pesoMassa: 491.70, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "208": { pesoMassa: 491.70, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "901": { pesoMassa: 599.00, pesoCaixa: 10.00, pesoAlvoPacote: 1000.0 },
  "69901": { pesoMassa: 303.70, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "70974": { pesoMassa: 491.70, pesoCaixa: 12.00, pesoAlvoPacote: 300.0 },
  "72169": { pesoMassa: 511.00, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "72170": { pesoMassa: 511.00, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "73399": { pesoMassa: 539.50, pesoCaixa: 12.00, pesoAlvoPacote: 400.0 },
  "73400": { pesoMassa: 539.50, pesoCaixa: 12.00, pesoAlvoPacote: 400.0 },
  "73402": { pesoMassa: 539.50, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "76303": { pesoMassa: 515.50, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "76304": { pesoMassa: 515.50, pesoCaixa: 12.00, pesoAlvoPacote: 1000.0 },
  "76378": { pesoMassa: 599.00, pesoCaixa: 12.00, pesoAlvoPacote: 800.0 },
  "76379": { pesoMassa: 599.00, pesoCaixa: 12.00, pesoAlvoPacote: 800.0 },
  "76678": { pesoMassa: 515.50, pesoCaixa: 9.60, pesoAlvoPacote: 300.0 }, // Ajustado baseado na imagem do mensal
  "76679": { pesoMassa: 515.50, pesoCaixa: 9.60, pesoAlvoPacote: 800.0 }, // Ajustado baseado na imagem do mensal
  "76792": { pesoMassa: 599.06, pesoCaixa: 10.00, pesoAlvoPacote: 1000.0 },
  "74231": { pesoMassa: 526.00, pesoCaixa: 6.00, pesoAlvoPacote: 1000.0 }
};

const socket = io();

let state = {
  producao: {},
  mensal: {},
  planReal: {},
  relatorio: {},
  paradas: {}
};

let isConnected = false;

socket.on('connect', () => {
  isConnected = true;
  window.dispatchEvent(new CustomEvent('connection_changed', { detail: { connected: true } }));
});

socket.on('disconnect', () => {
  isConnected = false;
  window.dispatchEvent(new CustomEvent('connection_changed', { detail: { connected: false } }));
});

socket.on('initial_state', (initialState) => {
  state = initialState;
  window.dispatchEvent(new CustomEvent('data_updated'));
});

socket.on('producao_updated', ({ date, data }) => {
  state.producao[date] = data;
  window.dispatchEvent(new CustomEvent('data_updated', { detail: { type: 'producao', date } }));
});

socket.on('mensal_updated', ({ month, data }) => {
  state.mensal[month] = data;
  window.dispatchEvent(new CustomEvent('data_updated', { detail: { type: 'mensal', month } }));
});

socket.on('planReal_updated', ({ date, data }) => {
  state.planReal[date] = data;
  window.dispatchEvent(new CustomEvent('data_updated', { detail: { type: 'planReal', date } }));
});

socket.on('relatorio_updated', ({ month, data }) => {
  state.relatorio[month] = data;
  window.dispatchEvent(new CustomEvent('data_updated', { detail: { type: 'relatorio', month } }));
});

socket.on('paradas_updated', ({ date, data }) => {
  state.paradas[date] = data;
  window.dispatchEvent(new CustomEvent('data_updated', { detail: { type: 'paradas', date } }));
});

export const dataService = {
  async getDataByDate(date) { return state.producao[date] || []; },
  async saveDataByDate(date, data) { state.producao[date] = data; socket.emit('update_producao', { date, data }); },
  
  async getMonthlyData(month) { return state.mensal[month] || []; },
  async saveMonthlyData(month, data) { state.mensal[month] = data; socket.emit('update_mensal', { month, data }); },
  
  async getPlanRealData(date) { return state.planReal[date] || []; },
  async savePlanRealData(date, data) { state.planReal[date] = data; socket.emit('update_planReal', { date, data }); },
  
  async getRelatorioData(month) { return state.relatorio[month] || []; },
  async saveRelatorioData(month, data) { state.relatorio[month] = data; socket.emit('update_relatorio', { month, data }); },

  async getParadasData(date) { return state.paradas[date] || []; },
  async saveParadasData(date, data) { state.paradas[date] = data; socket.emit('update_paradas', { date, data }); },

  getConnectionStatus() {
    return isConnected;
  }
};
