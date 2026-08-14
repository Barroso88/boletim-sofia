import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO, formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Milk, Trash2, Calendar as CalendarIcon, Clock, Minus, Sparkles, ChevronLeft, ChevronRight, Droplets, Layers, Pencil, AlertTriangle, X, BarChart2, TrendingUp, Award, Package } from 'lucide-react';
import { api } from '../services/api';
import './Leite.css';
import biberaoIcon from '../assets/icons/baby-bottle.png';
import fraldaIcon from '../assets/icons/diaper.png';
import dormirIcon from '../assets/icons/baby-sleep.png';
import milkIcon from '../assets/icons/milk.png';

const PRESET_AMOUNTS = [30, 60, 90, 120, 150, 180, 210, 240];
const DIAPER_TYPES = [
  { id: 'Cocó', label: 'Cocó', icon: '💩', badgeClass: 'coco' },
  { id: 'Xixi', label: 'Xixi', icon: '💧', badgeClass: 'xixi' },
  { id: 'Cocó + Xixi', label: 'Cocó + Xixi', icon: '🧻', badgeClass: 'coco-xixi' },
];

const Leite = () => {
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return sessionStorage.getItem('leite_active_tab') || 'leite';
  });

  useEffect(() => {
    sessionStorage.setItem('leite_active_tab', activeSubTab);
  }, [activeSubTab]);

  // Leite State
  const [registosLeite, setRegistosLeite] = useState([]);
  const [latas, setLatas] = useState([]);
  const [modalLataAberta, setModalLataAberta] = useState(false);
  const [nomeLata, setNomeLata] = useState('');
  const [dataLata, setDataLata] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horaLata, setHoraLata] = useState(format(new Date(), 'HH:mm'));
  const [editandoIdLata, setEditandoIdLata] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adicionandoLeite, setAdicionandoLeite] = useState(false);
  const [editandoIdLeite, setEditandoIdLeite] = useState(null);
  const [novaHoraLeite, setNovaHoraLeite] = useState(format(new Date(), 'HH:mm'));
  const [novaQuantidade, setNovaQuantidade] = useState(150);
  const [mostrarRelatorioSemanal, setMostrarRelatorioSemanal] = useState(false);

  // Fraldas State
  const [registosFraldas, setRegistosFraldas] = useState([]);
  const [adicionandoFralda, setAdicionandoFralda] = useState(false);
  const [editandoIdFralda, setEditandoIdFralda] = useState(null);
  const [novaHoraFralda, setNovaHoraFralda] = useState(format(new Date(), 'HH:mm'));
  const [tipoFraldaSelecionado, setTipoFraldaSelecionado] = useState('Xixi');
  const [mostrarRelatorioFraldas, setMostrarRelatorioFraldas] = useState(false);

  // Sonos State
  const [registosSonos, setRegistosSonos] = useState([]);
  const [adicionandoSono, setAdicionandoSono] = useState(false);
  const [editandoIdSono, setEditandoIdSono] = useState(null);
  const [novaHoraInicioSono, setNovaHoraInicioSono] = useState(format(new Date(), 'HH:mm'));
  const [novaHoraFimSono, setNovaHoraFimSono] = useState('');
  const [novaDataSono, setNovaDataSono] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mostrarRelatorioSonos, setMostrarRelatorioSonos] = useState(false);
  useEffect(() => {
    api.getLeite().then(data => setRegistosLeite(data));
    api.getFraldas().then(data => setRegistosFraldas(data));
    api.getSonos().then(data => setRegistosSonos(data));
    api.getLatas().then(data => setLatas(data));
  }, []);

  // --- RELATÓRIO SEMANAL CALCULATIONS ---
  const getDadosRelatorioSemanal = () => {
    const START_DATE_STR = '2026-08-05';
    const hoje = new Date();
    const dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoje, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      // Ignore days before tracking start date (05/08/2026)
      if (dateStr < START_DATE_STR) continue;

      const dayLabelRaw = format(d, 'eee', { locale: ptBR });
      const dayFullLabel = format(d, "eeee (dd/MM)", { locale: ptBR });
      
      const registosDoDia = registosLeite.filter(r => r.data === dateStr);
      const totalMl = registosDoDia.reduce((acc, r) => acc + (r.quantidade_ml || 0), 0);
      const count = registosDoDia.length;
      const avgMl = count > 0 ? Math.round(totalMl / count) : 0;

      const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1, 3);

      dias.push({
        dateStr,
        dayLabel,
        dayFullLabel: dayFullLabel.charAt(0).toUpperCase() + dayFullLabel.slice(1),
        totalMl,
        count,
        avgMl
      });
    }

    const numDiasValidos = Math.max(dias.length, 1);
    const totalSemanalMl = dias.reduce((sum, d) => sum + d.totalMl, 0);
    const totalSemanalMamadas = dias.reduce((sum, d) => sum + d.count, 0);
    const mediaDiariaMl = Math.round(totalSemanalMl / numDiasValidos);
    const mediaMamadasDia = (totalSemanalMamadas / numDiasValidos).toFixed(1);

    let maxDia = dias[0] || { totalMl: 0, dayLabel: '--' };
    dias.forEach(d => {
      if (d.totalMl > maxDia.totalMl) maxDia = d;
    });

    const maxMlGraph = Math.max(...dias.map(d => d.totalMl), 100);

    return {
      dias,
      totalSemanalMl,
      totalSemanalMamadas,
      mediaDiariaMl,
      mediaMamadasDia,
      maxDia,
      maxMlGraph,
      numDiasValidos
    };
  };

  // --- RELATÓRIO SEMANAL FRALDAS CALCULATIONS ---
  const getDadosRelatorioFraldas = () => {
    const START_DATE_STR = '2026-08-05';
    const hoje = new Date();
    const dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoje, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      if (dateStr < START_DATE_STR) continue;

      const dayLabelRaw = format(d, 'eee', { locale: ptBR });
      const dayFullLabel = format(d, "eeee (dd/MM)", { locale: ptBR });
      
      const registosDoDia = registosFraldas.filter(r => r.data === dateStr);
      const countTotal = registosDoDia.length;
      
      let countXixi = 0;
      let countCoco = 0;
      let countAmbos = 0;

      registosDoDia.forEach(r => {
        const t = (r.tipo || '').toLowerCase();
        if (t.includes('cocó') && t.includes('xixi')) countAmbos++;
        else if (t.includes('cocó')) countCoco++;
        else countXixi++;
      });

      const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1, 3);

      dias.push({
        dateStr,
        dayLabel,
        dayFullLabel: dayFullLabel.charAt(0).toUpperCase() + dayFullLabel.slice(1),
        countTotal,
        countXixi,
        countCoco,
        countAmbos
      });
    }

    const numDiasValidos = Math.max(dias.length, 1);
    const totalSemanalFraldas = dias.reduce((sum, d) => sum + d.countTotal, 0);
    const totalSemanalXixi = dias.reduce((sum, d) => sum + d.countXixi + d.countAmbos, 0);
    const totalSemanalCoco = dias.reduce((sum, d) => sum + d.countCoco + d.countAmbos, 0);
    
    const mediaDiariaFraldas = (totalSemanalFraldas / numDiasValidos).toFixed(1);

    let maxDia = dias[0] || { countTotal: 0, dayLabel: '--' };
    dias.forEach(d => {
      if (d.countTotal > maxDia.countTotal) maxDia = d;
    });

    const maxFraldasGraph = Math.max(...dias.map(d => d.countTotal), 5);

    return {
      dias,
      totalSemanalFraldas,
      totalSemanalXixi,
      totalSemanalCoco,
      mediaDiariaFraldas,
      maxDia,
      maxFraldasGraph,
      numDiasValidos
    };
  };

  // --- RELATÓRIO SEMANAL SONOS CALCULATIONS ---
  const getDadosRelatorioSonos = () => {
    const START_DATE_STR = '2026-08-05';
    const hoje = new Date();
    const dias = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(hoje, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (dateStr < START_DATE_STR) continue;

      const dayLabelRaw = format(d, 'eee', { locale: ptBR });
      const dayFullLabel = format(d, "eeee (dd/MM)", { locale: ptBR });
      
      const dateObj = parseISO(dateStr);
      const dataAnteriorStr = format(subDays(dateObj, 1), 'yyyy-MM-dd');

      const registosDoDia = registosSonos
        .map(reg => {
          if (reg.data === dateStr) {
            if (reg.hora_fim && reg.hora_fim < reg.hora_inicio) {
              const [hI, mI] = reg.hora_inicio.split(':').map(Number);
              const duracaoHoje = (24 * 60) - (hI * 60 + mI);
              return { ...reg, duracao_dia: duracaoHoje };
            }
            return { ...reg, duracao_dia: reg.duracao_minutos };
          } else if (reg.data === dataAnteriorStr && (!reg.hora_fim || reg.hora_fim < reg.hora_inicio)) {
            let duracaoHoje = 0;
            if (reg.hora_fim) {
              const [hF, mF] = reg.hora_fim.split(':').map(Number);
              duracaoHoje = (hF * 60 + mF);
            }
            return { ...reg, duracao_dia: duracaoHoje };
          }
          return null;
        })
        .filter(Boolean);

      const totalMinutos = registosDoDia.reduce((sum, r) => sum + r.duracao_dia, 0);
      const numSestas = registosDoDia.length;

      const dayLabel = dayLabelRaw.charAt(0).toUpperCase() + dayLabelRaw.slice(1, 3);
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      const totalFormatado = `${horas}h ${minutos}m`;

      dias.push({
        dateStr,
        dayLabel,
        dayFullLabel: dayFullLabel.charAt(0).toUpperCase() + dayFullLabel.slice(1),
        totalMinutos,
        totalFormatado,
        numSestas
      });
    }

    const numDiasValidos = Math.max(dias.length, 1);
    const totalSemanalMinutos = dias.reduce((sum, d) => sum + d.totalMinutos, 0);
    const mediaDiariaMinutos = Math.round(totalSemanalMinutos / numDiasValidos);
    const horasMedia = Math.floor(mediaDiariaMinutos / 60);
    const minutosMedia = mediaDiariaMinutos % 60;
    const mediaDiariaFormatada = `${horasMedia}h ${minutosMedia}m`;

    let maxDia = dias[0] || { totalMinutos: 0, dayLabel: '--' };
    dias.forEach(d => {
      if (d.totalMinutos > maxDia.totalMinutos) maxDia = d;
    });

    const maxMinutosGraph = Math.max(...dias.map(d => d.totalMinutos), 60); // min 1h

    return {
      dias,
      mediaDiariaFormatada,
      totalSemanalSestas: dias.reduce((sum, d) => sum + d.numSestas, 0),
      maxDia,
      maxMinutosGraph,
      numDiasValidos
    };
  };

  // --- LEITE CALCULATIONS ---
  const registosLeiteDoDia = registosLeite
    .filter(r => r.data === dataSelecionada)
    .sort((a, b) => b.hora.localeCompare(a.hora));

  const totalMlDoDia = registosLeiteDoDia.reduce((sum, r) => sum + r.quantidade_ml, 0);

  const registosLeiteGeral = [...registosLeite].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });
  const ultimaMamada = registosLeiteGeral[0];

  const getTempoDesdeUltimaMamada = () => {
    if (!ultimaMamada) return null;
    try {
      const dataHoraStr = `${ultimaMamada.data}T${ultimaMamada.hora}:00`;
      const past = new Date(dataHoraStr);
      const now = new Date();
      const diffMs = now - past;
      if (isNaN(diffMs) || diffMs < 0) return '0 min';

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0) return `${minutes} min`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}min`;
    } catch (e) {
      return null;
    }
  };
  const calcularStockLata = () => {
    if (latas.length === 0) return null;
    const lataAtual = latas[0];
    const capacidade = lataAtual.capacidade_ml || 5580;
    const tsLata = new Date(`${lataAtual.data_abertura}T${lataAtual.hora_abertura || '00:00'}:00`).getTime();
    
    const milkSince = registosLeite.filter(r => r.id >= tsLata);
    const consumido = milkSince.reduce((sum, r) => sum + r.quantidade_ml, 0);
    const restante = Math.max(0, capacidade - consumido);
    const percent = Math.min(100, Math.max(0, (restante / capacidade) * 100));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timestamp7Days = sevenDaysAgo.getTime();
    const milk7Days = registosLeite.filter(r => r.id >= timestamp7Days);
    const total7Days = milk7Days.reduce((sum, r) => sum + r.quantidade_ml, 0);
    
    // avoid divide by zero if not enough data, assume avg 800ml/day
    const mediaDiaria = total7Days > 0 ? (total7Days / 7) : 800; 
    
    const percentConsumido = Math.min(100, Math.max(0, (consumido / capacidade) * 100));
    const diasRestantes = Math.round(restante / mediaDiaria);

    return {
      lata: lataAtual,
      consumido,
      capacidade,
      restante,
      percent,
      percentConsumido,
      diasRestantes
    };
  };

  const salvarLata = () => {
    const id = new Date(`${dataLata}T${horaLata}:00`).getTime();
    if (editandoIdLata) {
      const original = latas.find(l => l.id === editandoIdLata);
      if (!original) return;
      const novaLata = { ...original, nome_formula: nomeLata, data_abertura: dataLata, hora_abertura: horaLata, id };
      api.editLata(editandoIdLata, novaLata).then(() => {
        setLatas(latas.map(l => l.id === editandoIdLata ? novaLata : l));
        fecharModalLata();
      });
    } else {
      const novaLata = {
        id,
        data_abertura: dataLata,
        hora_abertura: horaLata,
        capacidade_ml: 5580,
        nome_formula: nomeLata
      };
      api.addLata(novaLata).then(() => {
        setLatas([novaLata, ...latas]);
        fecharModalLata();
      });
    }
  };

  const abrirEdicaoLata = (lata) => {
    setEditandoIdLata(lata.id);
    setNomeLata(lata.nome_formula || '');
    setDataLata(lata.data_abertura || format(new Date(), 'yyyy-MM-dd'));
    setHoraLata(lata.hora_abertura || format(new Date(), 'HH:mm'));
    setModalLataAberta(true);
  };

  const fecharModalLata = () => {
    setModalLataAberta(false); 
    setEditandoIdLata(null); 
    setNomeLata('');
    setDataLata(format(new Date(), 'yyyy-MM-dd'));
    setHoraLata(format(new Date(), 'HH:mm'));
  };

  const abrirEdicaoLeite = (reg) => {
    setEditandoIdLeite(reg.id);
    setNovaHoraLeite(reg.hora);
    setNovaQuantidade(reg.quantidade_ml);
    setAdicionandoLeite(true);
  };

  const adicionarRegistoLeite = (e) => {
    e.preventDefault();
    if (!novaHoraLeite || !novaQuantidade) return;
    const registo = {
      id: editandoIdLeite || Date.now(),
      data: dataSelecionada,
      hora: novaHoraLeite,
      quantidade_ml: Number(novaQuantidade),
    };
    setRegistosLeite(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [registo, ...prev];
    });
    api.saveLeite(registo);
    setAdicionandoLeite(false);
    setEditandoIdLeite(null);
  };

  // --- SONOS CALCULATIONS ---
  const dataSelecionadaObj = parseISO(dataSelecionada);
  const dataAnteriorStr = format(subDays(dataSelecionadaObj, 1), 'yyyy-MM-dd');

  const registosSonosDoDia = registosSonos
    .map(reg => {
      if (reg.data === dataSelecionada) {
        if (reg.hora_fim && reg.hora_fim < reg.hora_inicio) {
          // Started today, ends tomorrow. Split duration for today: start to 23:59.
          const [hI, mI] = reg.hora_inicio.split(':').map(Number);
          const duracaoHoje = (24 * 60) - (hI * 60 + mI);
          return { ...reg, duracao_dia: duracaoHoje, is_split_start: true };
        }
        return { ...reg, duracao_dia: reg.duracao_minutos };
      } else if (reg.data === dataAnteriorStr && (!reg.hora_fim || reg.hora_fim < reg.hora_inicio)) {
        // Started yesterday, ended today OR still ongoing. Split duration for today: 00:00 to end.
        let duracaoHoje = 0;
        if (reg.hora_fim) {
          const [hF, mF] = reg.hora_fim.split(':').map(Number);
          duracaoHoje = (hF * 60 + mF);
        }
        return { ...reg, duracao_dia: duracaoHoje, is_split_end: true };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      // If it's a split end (started yesterday), it effectively starts at 00:00 today.
      const timeA = a.is_split_end ? '00:00' : a.hora_inicio;
      const timeB = b.is_split_end ? '00:00' : b.hora_inicio;
      return timeB.localeCompare(timeA);
    });

  const totalMinutosDoDia = registosSonosDoDia.reduce((sum, r) => sum + r.duracao_dia, 0);
  const totalHorasSono = Math.floor(totalMinutosDoDia / 60);
  const totalMinutosResto = totalMinutosDoDia % 60;
  const totalSonoFormatado = `${totalHorasSono}h ${totalMinutosResto}m`;

  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return 0;
    const [hI, mI] = inicio.split(':').map(Number);
    const [hF, mF] = fim.split(':').map(Number);
    let duracao = (hF * 60 + mF) - (hI * 60 + mI);
    if (duracao < 0) {
      duracao += 24 * 60; // Passou da meia-noite
    }
    return duracao;
  };

  const duracaoPrevista = calcularDuracao(novaHoraInicioSono, novaHoraFimSono);
  const horasPrevistas = Math.floor(duracaoPrevista / 60);
  const minutosPrevistos = duracaoPrevista % 60;

  const abrirEdicaoSono = (reg) => {
    setEditandoIdSono(reg.id);
    setNovaDataSono(reg.data);
    setNovaHoraInicioSono(reg.hora_inicio);
    setNovaHoraFimSono(reg.hora_fim);
    setAdicionandoSono(true);
  };

  const adicionarRegistoSono = (e) => {
    e.preventDefault();
    if (!novaHoraInicioSono) return;
    const duracao = novaHoraFimSono ? calcularDuracao(novaHoraInicioSono, novaHoraFimSono) : 0;
    if (novaHoraFimSono && duracao === 0) return; // Evitar registos de 0 min se tiver hora fim
    
    const registo = {
      id: editandoIdSono || Date.now(),
      data: novaDataSono,
      hora_inicio: novaHoraInicioSono,
      hora_fim: novaHoraFimSono || "",
      duracao_minutos: duracao,
    };
    setRegistosSonos(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [registo, ...prev];
    });
    api.saveSono(registo);
    setAdicionandoSono(false);
    setEditandoIdSono(null);
  };

  const terminarSono = (reg) => {
    const horaAtual = format(new Date(), 'HH:mm');
    const duracao = calcularDuracao(reg.hora_inicio, horaAtual);
    const novoRegisto = { ...reg, hora_fim: horaAtual, duracao_minutos: duracao };
    
    setRegistosSonos(prev => prev.map(r => r.id === reg.id ? novoRegisto : r));
    api.saveSono(novoRegisto);
  };

  const [confirmarDelete, setConfirmarDelete] = useState(null); // { id, type }

  const apagarRegistoConfirmado = () => {
    if (!confirmarDelete) return;
    const { id, type } = confirmarDelete;
    if (type === 'leite') {
      setRegistosLeite(prev => prev.filter(r => r.id !== id));
      api.deleteLeite(id);
    } else if (type === 'fralda') {
      setRegistosFraldas(prev => prev.filter(f => f.id !== id));
      api.deleteFralda(id);
    } else if (type === 'sono') {
      setRegistosSonos(prev => prev.filter(s => s.id !== id));
      api.deleteSono(id);
    } else if (type === 'lata') {
      setLatas(prev => prev.filter(l => l.id !== id));
      api.deleteLata(id);
    }
    setConfirmarDelete(null);
  };

  // --- FRALDAS CALCULATIONS ---
  const registosFraldasDoDia = registosFraldas
    .filter(r => r.data === dataSelecionada)
    .sort((a, b) => b.hora.localeCompare(a.hora));

  const countCoco = registosFraldasDoDia.filter(f => f.tipo === 'Cocó').length;
  const countXixi = registosFraldasDoDia.filter(f => f.tipo === 'Xixi').length;
  const countCocoXixi = registosFraldasDoDia.filter(f => f.tipo === 'Cocó + Xixi').length;

  const registosFraldasGeral = [...registosFraldas].sort((a, b) => {
    const dtA = `${a.data}T${a.hora}`;
    const dtB = `${b.data}T${b.hora}`;
    return dtB.localeCompare(dtA);
  });
  const ultimaFralda = registosFraldasGeral[0];

  const getTempoDesdeUltimaFralda = () => {
    if (!ultimaFralda) return null;
    try {
      const dataHoraStr = `${ultimaFralda.data}T${ultimaFralda.hora}:00`;
      const past = new Date(dataHoraStr);
      const now = new Date();
      const diffMs = now - past;
      if (isNaN(diffMs) || diffMs < 0) return '0 min';

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0) return `${minutes} min`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}min`;
    } catch (e) {
      return null;
    }
  };

  const abrirEdicaoFralda = (reg) => {
    setEditandoIdFralda(reg.id);
    setNovaHoraFralda(reg.hora);
    setTipoFraldaSelecionado(reg.tipo);
    setAdicionandoFralda(true);
  };

  const adicionarRegistoFralda = (e) => {
    e.preventDefault();
    if (!novaHoraFralda || !tipoFraldaSelecionado) return;
    const registo = {
      id: editandoIdFralda || Date.now(),
      data: dataSelecionada,
      hora: novaHoraFralda,
      tipo: tipoFraldaSelecionado,
    };
    setRegistosFraldas(prev => {
      const exists = prev.some(r => r.id === registo.id);
      if (exists) return prev.map(r => r.id === registo.id ? registo : r);
      return [registo, ...prev];
    });
    api.saveFralda(registo);
    setAdicionandoFralda(false);
    setEditandoIdFralda(null);
  };

  const apagarRegistoFralda = (id) => {
    setRegistosFraldas(prev => prev.filter(f => f.id !== id));
    api.deleteFralda(id);
  };

  // --- DATE HELPERS ---
  const mudarDia = (offset) => {
    const curr = parseISO(dataSelecionada);
    curr.setDate(curr.getDate() + offset);
    setDataSelecionada(format(curr, 'yyyy-MM-dd'));
  };

  const hojeStr = format(new Date(), 'yyyy-MM-dd');
  const ontemStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const diaDaSemana = format(parseISO(dataSelecionada), 'EEEE, d \'de\' MMMM', { locale: ptBR });

  const adjustAmount = (delta) => {
    setNovaQuantidade(prev => Math.max(10, Math.min(500, prev + delta)));
  };

  return (
    <div className="page-container leite-container">
      {/* Header */}
      <header className="page-header mb-2">
        <h1 className="page-title">
          <span>Leite & Fraldas & Sono</span>
          <Sparkles size={24} style={{ color: 'var(--color-secondary)' }} />
        </h1>
        <p className="text-secondary" style={{ marginTop: '0.2rem' }}>Acompanhamento diário da Sofia</p>
      </header>

      {/* Sub Tabs Switcher */}
      <div className="sub-tabs-container">
        <button
          className={`sub-tab-btn btn-leite ${activeSubTab === 'leite' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('leite')}
        >
          <img src={biberaoIcon} alt="Leite" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          <span>Leite</span>
        </button>
        <button
          className={`sub-tab-btn btn-fraldas ${activeSubTab === 'fraldas' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('fraldas')}
        >
          <img src={fraldaIcon} alt="Fraldas" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          <span>Fraldas</span>
        </button>
        <button
          className={`sub-tab-btn btn-sono ${activeSubTab === 'sonos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sonos')}
        >
          <img src={dormirIcon} alt="Sono" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          <span>Sono</span>
        </button>
      </div>

      {/* Date Navigation Bar */}
      <div className="date-selector-bar">
        <button className="btn-icon" onClick={() => mudarDia(-1)} title="Dia anterior">
          <ChevronLeft size={20} />
        </button>

        <div className="date-quick-chips">
          <button
            className={`chip-btn ${dataSelecionada === ontemStr ? 'active' : ''}`}
            onClick={() => setDataSelecionada(ontemStr)}
          >
            Ontem
          </button>
          <button
            className={`chip-btn ${dataSelecionada === hojeStr ? 'active' : ''}`}
            onClick={() => setDataSelecionada(hojeStr)}
          >
            Hoje
          </button>
        </div>

        <div className="date-input-wrapper">
          <CalendarIcon size={16} className="text-primary" />
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="date-input-hidden"
          />
        </div>

        <button className="btn-icon" onClick={() => mudarDia(1)} title="Dia seguinte">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ─── TAB 1: LEITE ────────────────────────────────────────────────── */}
      {activeSubTab === 'leite' && (
        <>

          {/* Hero Stats Card */}
          <div className="leite-hero-card">
            <div className="hero-top-row">
              <div className="hero-title-group">
                <div className="icon-badge-glow">
                  <img src={biberaoIcon} alt="Leite" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 className="hero-day-title">{diaDaSemana}</h2>
                  <p className="hero-day-subtitle">Resumo de consumo de leite</p>
                </div>
              </div>
            </div>

            <div className="hero-main-stat">
              <span className="hero-stat-value">{totalMlDoDia}</span>
              <span className="hero-stat-unit">ml de leite</span>
            </div>

            <div className="hero-grid-stats">
              <div className="substat-card">
                <div className="substat-val">{registosLeiteDoDia.length}</div>
                <div className="substat-lbl">Mamadas</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{totalMlDoDia} ml</div>
                <div className="substat-lbl">Total diário</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">
                  {getTempoDesdeUltimaMamada() ? getTempoDesdeUltimaMamada().replace('há ', '') : '--'}
                </div>
                <div className="substat-lbl">Última mamada</div>
              </div>
            </div>
          </div>

          {/* Quick Add Button / Form */}
          {!adicionandoLeite ? (
            <button
              className="btn-quick-add"
              onClick={() => {
                setAdicionandoLeite(true);
                setNovaHoraLeite(format(new Date(), 'HH:mm'));
              }}
            >
              <Plus size={22} />
              <span>Registar Nova Mamada</span>
            </button>
          ) : (
            <form className="add-form-card" onSubmit={adicionarRegistoLeite}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
                  <img src={biberaoIcon} alt="Leite" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  <span>Registar Mamada</span>
                </h3>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{dataSelecionada}</span>
              </div>

              {/* Stepper Quantity Picker */}
              <div className="quantity-stepper-container">
                <div className="form-section-title">Quantidade</div>
                
                <div className="stepper-main">
                  <button
                    type="button"
                    className="btn-stepper"
                    onClick={() => adjustAmount(-10)}
                    title="-10ml"
                  >
                    <Minus size={22} />
                  </button>

                  <div className="stepper-display">
                    <div className="stepper-number">{novaQuantidade}</div>
                    <div className="stepper-unit">mililitros</div>
                  </div>

                  <button
                    type="button"
                    className="btn-stepper"
                    onClick={() => adjustAmount(10)}
                    title="+10ml"
                  >
                    <Plus size={22} />
                  </button>
                </div>

                {/* Presets */}
                <div className="presets-grid">
                  {PRESET_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`preset-chip ${novaQuantidade === amt ? 'selected' : ''}`}
                      onClick={() => setNovaQuantidade(amt)}
                    >
                      {amt} ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <Clock size={18} className="text-secondary" />
                  <input
                    type="time"
                    value={novaHoraLeite}
                    onChange={(e) => setNovaHoraLeite(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, borderRadius: '16px', padding: '0.85rem' }}
                  onClick={() => setAdicionandoLeite(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, borderRadius: '16px', padding: '0.85rem', boxShadow: '0 4px 15px rgba(244,63,94,0.3)' }}
                >
                  Confirmar Mamada
                </button>
              </div>
            </form>
          )}

          {/* Feedings Feed Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
              <Droplets size={18} className="text-primary" />
              <span>Mamadas Registadas</span>
            </h3>
            <span className="badge" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
              {registosLeiteDoDia.length}
            </span>
          </div>

          {/* Feedings List */}
          <div className="feedings-list">
            {registosLeiteDoDia.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon-circle">
                  <img src={biberaoIcon} alt="Leite" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text)', fontWeight: '800' }}>Sem registos hoje</h4>
                <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                  Toque no botão acima para registar a primeira mamada da Sofia neste dia.
                </p>
              </div>
            ) : (
              registosLeiteDoDia.map(reg => (
                <div key={reg.id} className="feeding-card">
                  <div className="feeding-left">
                    <div className="feeding-icon-box">
                      <img src={biberaoIcon} alt="Leite" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div className="feeding-time">{reg.hora}</div>
                      <div className="feeding-relative-time">
                        {dataSelecionada === hojeStr ? 'Hoje' : dataSelecionada}
                      </div>
                    </div>
                  </div>

                  <div className="btn-action-group">
                    <div className="feeding-amount-badge">
                      <span className="amount-val">{reg.quantidade_ml}</span>
                      <span className="amount-unit">ml</span>
                    </div>

                    <button
                      className="btn-action-edit"
                      onClick={() => abrirEdicaoLeite(reg)}
                      title="Editar registo"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      className="btn-action-delete"
                      onClick={() => setConfirmarDelete({ id: reg.id, type: 'leite' })}
                      title="Apagar registo"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stock de Leite Card (Despensa) */}
          {(() => {
            const stock = calcularStockLata();
            if (!stock) {
              return (
                <div className="leite-hero-card" style={{ marginBottom: '1rem', marginTop: '1.5rem', background: 'var(--color-surface)' }}>
                  <div className="hero-title-group" style={{ marginBottom: '1rem' }}>
                    <div className="icon-badge-glow" style={{ background: 'var(--color-secondary)' }}>
                      <img src={milkIcon} alt="Lata" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 0.1rem 0', color: 'var(--color-text)' }}>Despensa de Leite</h3>
                      <p className="hero-day-subtitle">Nenhuma lata aberta de momento</p>
                    </div>
                  </div>
                  <button className="btn-primary w-100" onClick={() => setModalLataAberta(true)}>
                    <Plus size={18} /> Registar Lata Aberta
                  </button>
                </div>
              );
            }
            
            return (
              <div className="leite-hero-card" style={{ marginBottom: '1rem', marginTop: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                <div className="hero-title-group" style={{ marginBottom: '1rem', justifyContent: 'space-between', display: 'flex' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="icon-badge-glow" style={{ background: 'var(--color-primary)' }}>
                      <img src={milkIcon} alt="Lata" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 0.2rem 0', color: 'var(--color-text)' }}>{stock.lata.nome_formula || 'Lata de Leite'}</h3>
                      <p className="hero-day-subtitle">Aberta a {stock.lata.data_abertura} {stock.lata.hora_abertura ? `às ${stock.lata.hora_abertura}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon text-secondary" onClick={() => abrirEdicaoLata(stock.lata)} title="Editar lata" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%' }}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => setConfirmarDelete({ id: stock.lata.id, type: 'lata' })} title="Apagar lata" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => setModalLataAberta(true)} title="Abrir nova lata" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '500' }}>{stock.consumido} ml consumidos</span>
                  <span className="text-secondary">{stock.capacidade} ml</span>
                </div>
                
                <div style={{ 
                  width: '100%', 
                  height: '14px', 
                  background: 'rgba(0,0,0,0.06)', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  marginBottom: '0.85rem',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${stock.percentConsumido}%`, 
                    background: stock.percentConsumido > 90 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 
                                stock.percentConsumido > 75 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 
                                'linear-gradient(90deg, var(--color-primary), #fb7185)',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }}></div>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={14} />
                  <span>Previsão: restam cerca de <strong>{stock.diasRestantes} dias</strong></span>
                </div>
              </div>
            );
          })()}

          {/* Button to Open Weekly Feeding Report */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-weekly-report"
              onClick={() => setMostrarRelatorioSemanal(true)}
            >
              <BarChart2 size={20} />
              <span>Ver Relatório Semanal das Mamadas</span>
            </button>
          </div>
        </>
      )}

      {/* ─── TAB 2: FRALDAS ──────────────────────────────────────────────── */}
      {activeSubTab === 'fraldas' && (
        <>
          {/* Hero Stats Card */}
          <div className="leite-hero-card">
            <div className="hero-top-row">
              <div className="hero-title-group">
                <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
                  <img src={fraldaIcon} alt="Fraldas" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 className="hero-day-title">{diaDaSemana}</h2>
                  <p className="hero-day-subtitle">Resumo de troca de fraldas</p>
                </div>
              </div>
            </div>

            <div className="hero-main-stat">
              <span className="hero-stat-value" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {registosFraldasDoDia.length}
              </span>
              <span className="hero-stat-unit">fraldas trocadas</span>
            </div>

            <div className="hero-grid-stats">
              <div className="substat-card">
                <div className="substat-val">{countXixi}</div>
                <div className="substat-lbl">Xixi 💧</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{countCoco}</div>
                <div className="substat-lbl">Cocó 💩</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{countCocoXixi}</div>
                <div className="substat-lbl">Ambos 🧻</div>
              </div>
            </div>
          </div>

          {/* Quick Add Button / Form */}
          {!adicionandoFralda ? (
            <button
              className="btn-quick-add"
              style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)', boxShadow: '0 8px 25px rgba(2, 132, 199, 0.35)' }}
              onClick={() => {
                setAdicionandoFralda(true);
                setNovaHoraFralda(format(new Date(), 'HH:mm'));
              }}
            >
              <Plus size={22} />
              <span>Registar Nova Fralda</span>
            </button>
          ) : (
            <form className="add-form-card" onSubmit={adicionarRegistoFralda}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
                  <img src={fraldaIcon} alt="Fraldas" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  <span>Registar Fralda</span>
                </h3>
                <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{dataSelecionada}</span>
              </div>

              {/* Diaper Type Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-section-title">Tipo de Fralda</div>
                <div className="diaper-type-grid">
                  {DIAPER_TYPES.map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      className={`diaper-type-btn ${tipoFraldaSelecionado === dt.id ? 'selected' : ''}`}
                      onClick={() => setTipoFraldaSelecionado(dt.id)}
                    >
                      <span className="diaper-type-icon">{dt.icon}</span>
                      <span>{dt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="form-section-title">Hora da Troca</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                  <Clock size={18} className="text-secondary" />
                  <input
                    type="time"
                    value={novaHoraFralda}
                    onChange={(e) => setNovaHoraFralda(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, borderRadius: '16px', padding: '0.85rem' }}
                  onClick={() => setAdicionandoFralda(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, borderRadius: '16px', padding: '0.85rem', background: 'linear-gradient(135deg, #0284c7, #6366f1)', boxShadow: '0 4px 15px rgba(2,132,199,0.3)' }}
                >
                  Confirmar Fralda
                </button>
              </div>
            </form>
          )}

          {/* Diapers Feed Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <h3 className="h3 flex-center" style={{ gap: '0.5rem' }}>
              <img src={fraldaIcon} alt="Fraldas" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
              <span>Fraldas Registadas</span>
            </h3>
            <span className="badge" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
              {registosFraldasDoDia.length}
            </span>
          </div>

          {/* Diapers List */}
          <div className="feedings-list">
            {registosFraldasDoDia.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon-circle" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                  <img src={fraldaIcon} alt="Fraldas" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text)', fontWeight: '800' }}>Sem registos hoje</h4>
                <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                  Toque no botão acima para registar a primeira troca de fralda da Sofia neste dia.
                </p>
              </div>
            ) : (
              registosFraldasDoDia.map(reg => {
                const diaperMeta = DIAPER_TYPES.find(d => d.id === reg.tipo) || { icon: '🧷', badgeClass: 'xixi' };
                return (
                  <div key={reg.id} className="feeding-card">
                    <div className="feeding-left">
                      <div className="feeding-icon-box" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', fontSize: '1.2rem' }}>
                        {diaperMeta.icon}
                      </div>
                      <div>
                        <div className="feeding-time">{reg.hora}</div>
                        <div className="feeding-relative-time">
                          {dataSelecionada === hojeStr ? 'Hoje' : dataSelecionada}
                        </div>
                      </div>
                    </div>

                    <div className="btn-action-group">
                      <div className={`diaper-badge ${diaperMeta.badgeClass}`}>
                        <span>{diaperMeta.icon}</span>
                        <span>{reg.tipo}</span>
                      </div>

                      <button
                        className="btn-action-edit"
                        onClick={() => abrirEdicaoFralda(reg)}
                        title="Editar registo"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        className="btn-action-delete"
                        onClick={() => setConfirmarDelete({ id: reg.id, type: 'fralda' })}
                        title="Apagar registo"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Button to Open Weekly Diaper Report */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-weekly-report btn-weekly-report-diapers"
              onClick={() => setMostrarRelatorioFraldas(true)}
            >
              <BarChart2 size={20} />
              <span>Ver Relatório Semanal de Fraldas</span>
            </button>
          </div>
        </>
      )}

      {/* ─── TAB 3: SONOS ────────────────────────────────────────────────── */}
      {activeSubTab === 'sonos' && (
        <>
          {/* Hero Stats Card */}
          <div className="leite-hero-card">
            <div className="hero-top-row">
              <div className="hero-title-group">
                <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                  <img src={dormirIcon} alt="Sono" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 className="hero-day-title">{diaDaSemana}</h2>
                  <p className="hero-day-subtitle">Resumo de sonos</p>
                </div>
              </div>
            </div>

            <div className="hero-main-stat">
              <span className="hero-stat-value">{totalSonoFormatado.split('h')[0]}</span>
              <span className="hero-stat-unit">h {totalSonoFormatado.split(' ')[1]} de sono</span>
            </div>

            <div className="hero-grid-stats">
              <div className="substat-card">
                <div className="substat-val">{registosSonosDoDia.length}</div>
                <div className="substat-lbl">Sestas/Sonos</div>
              </div>
              <div className="substat-card">
                <div className="substat-val">{totalHorasSono}h {totalMinutosResto}m</div>
                <div className="substat-lbl">Total Diário</div>
              </div>
            </div>
          </div>

          {/* Quick Add Form */}
          {!adicionandoSono ? (
            <button
              className="btn-quick-add"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              onClick={() => {
                setAdicionandoSono(true);
                setNovaDataSono(dataSelecionada);
                setNovaHoraInicioSono(format(new Date(), 'HH:mm'));
                setNovaHoraFimSono('');
              }}
            >
              <Plus size={22} />
              <span>Registar Novo Sono</span>
            </button>
          ) : (
            <form className="add-form-card" onSubmit={adicionarRegistoSono}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 className="h3 flex-center" style={{ gap: '0.5rem', color: '#8b5cf6' }}>
                  <img src={dormirIcon} alt="Sono" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  <span>Registar Sono</span>
                </h3>
              </div>

              <div className="time-input-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 100%' }}>
                  <div className="form-section-title">Data de Início</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                    <CalendarIcon size={18} className="text-secondary" />
                    <input
                      type="date"
                      value={novaDataSono}
                      onChange={(e) => setNovaDataSono(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div className="form-section-title">Hora Início</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                    <Clock size={18} className="text-secondary" />
                    <input
                      type="time"
                      value={novaHoraInicioSono}
                      onChange={(e) => setNovaHoraInicioSono(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                      required
                    />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div className="form-section-title">Hora Fim</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem 1rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
                    <Clock size={18} className="text-secondary" />
                    <input
                      type="time"
                      value={novaHoraFimSono}
                      onChange={(e) => setNovaHoraFimSono(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.1rem', fontWeight: '700', outline: 'none', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>
              </div>

              {novaHoraFimSono ? (
                <div className="duracao-estimada" style={{ background: '#f3f4f6', borderRadius: '12px', padding: '1rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Duração do Sono</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
                    {horasPrevistas}h {minutosPrevistos}m
                  </span>
                </div>
              ) : (
                <div className="duracao-estimada" style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '12px', padding: '1rem', textAlign: 'center', marginBottom: '1.5rem', color: '#8b5cf6' }}>
                  <span style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>Em curso...</span>
                  <span style={{ fontSize: '0.85rem' }}>A duração será calculada quando a Sofia acordar.</span>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => {
                  setAdicionandoSono(false);
                  setEditandoIdSono(null);
                }}>
                  <X size={18} /> Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                  <Clock size={18} /> Guardar Sono
                </button>
              </div>
            </form>
          )}

          {/* Listagem de Sonos */}
          <div className="feedings-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
              <h3 className="h3" style={{ fontSize: '1.1rem', margin: 0 }}>Registos de {diaDaSemana.split(',')[0]}</h3>
              <span className="badge-ml" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                {registosSonosDoDia.length} {registosSonosDoDia.length === 1 ? 'registo' : 'registos'}
              </span>
            </div>

            {registosSonosDoDia.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap" style={{ background: 'rgba(139,92,246,0.1)' }}>
                  <img src={dormirIcon} alt="Sono" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <p>Nenhum sono registado neste dia.</p>
              </div>
            ) : (
              <>
                {registosSonosDoDia.map((reg) => {
                  const totalHrs = Math.floor(reg.duracao_minutos / 60);
                  const totalMins = reg.duracao_minutos % 60;
                  
                  const partialDuration = reg.duracao_dia;
                  const partialHrs = Math.floor(partialDuration / 60);
                  const partialMins = partialDuration % 60;

                  return (
                    <div key={reg.id} className="feeding-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                      <div className="feeding-left">
                        <div className="feeding-icon-box" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}>
                          <img src={dormirIcon} alt="Sono" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <div className="feeding-time" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            {reg.hora_inicio}
                            {reg.is_split_end && <span style={{fontSize: '0.75rem', opacity: 0.7}}>(ontem)</span>}
                            {' - '}
                            {reg.hora_fim ? (
                              <>
                                {reg.hora_fim}
                                {reg.is_split_start && <span style={{fontSize: '0.75rem', opacity: 0.7}}>(dia seg.)</span>}
                              </>
                            ) : (
                              <span style={{ color: '#8b5cf6', fontSize: '0.9rem', fontStyle: 'italic' }}>A dormir...</span>
                            )}
                          </div>
                          <div className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#4b5563' }}>
                              {reg.hora_fim ? (
                                <>{totalHrs > 0 ? `${totalHrs}h ` : ''}{totalMins}m</>
                              ) : (
                                'Em curso'
                              )}
                            </span>
                            {(reg.is_split_start || reg.is_split_end) && reg.hora_fim && (
                              <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '2px 6px', borderRadius: '10px' }} title="Tempo contabilizado para o dia de hoje">
                                Parcial: {partialHrs > 0 ? `${partialHrs}h ` : ''}{partialMins}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div className="btn-action-group">
                          <button className="btn-action-edit" onClick={() => abrirEdicaoSono(reg)} title="Editar">
                            <Pencil size={18} />
                          </button>
                          <button className="btn-action-delete" onClick={() => setConfirmarDelete({ id: reg.id, type: 'sono' })} title="Apagar">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        {!reg.hora_fim && (
                          <button 
                            className="btn-primary" 
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', width: '100%', padding: '0.4rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', color: '#fff', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)' }} 
                            onClick={() => terminarSono(reg)}
                          >
                            Acordou
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-weekly-report"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', color: '#fff', borderColor: 'transparent' }}
              onClick={() => setMostrarRelatorioSonos(true)}
            >
              <BarChart2 size={20} />
              <span>Ver Relatório Semanal de Sonos</span>
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmarDelete && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmarDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 800 }}>
                Remover {confirmarDelete.type === 'leite' ? 'Registo de Leite' : confirmarDelete.type === 'fralda' ? 'Registo de Fralda' : confirmarDelete.type === 'lata' ? 'Lata de Leite' : 'Registo de Sono'}?
              </h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.86rem', margin: 0 }}>
                Este registo será apagado permanentemente.
              </p>
            </div>
            <div className="form-actions" style={{ marginTop: '0.5rem' }}>
              <button className="btn-outline" onClick={() => setConfirmarDelete(null)}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
                onClick={apagarRegistoConfirmado}
              >
                <Trash2 size={16} /> Remover
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Relatório Semanal de Mamadas */}
      {mostrarRelatorioSemanal && (() => {
        const relatorio = getDadosRelatorioSemanal();
        return createPortal(
          <div className="modal-overlay" onClick={() => setMostrarRelatorioSemanal(false)}>
            <div className="modal-card weekly-report-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <h2 className="modal-title">Relatório Semanal das Mamadas</h2>
                    <p className="modal-subtitle">
                      {relatorio.numDiasValidos < 7
                        ? `Resumo dos registos (desde 05/08 · ${relatorio.numDiasValidos} ${relatorio.numDiasValidos === 1 ? 'dia' : 'dias'})`
                        : 'Resumo dos últimos 7 dias da Sofia'}
                    </p>
                  </div>
                </div>
                <button className="btn-action-close" onClick={() => setMostrarRelatorioSemanal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* 4 Cards de Métricas */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon text-primary"><TrendingUp size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaDiariaMl} <span className="stat-unit">ml</span></div>
                    <div className="weekly-stat-lbl">Média Diária</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon text-secondary"><Milk size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalMl} <span className="stat-unit">ml</span></div>
                    <div className="weekly-stat-lbl">{relatorio.numDiasValidos < 7 ? `Total (${relatorio.numDiasValidos}d)` : 'Total 7 Dias'}</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#8b5cf6' }}><Clock size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaMamadasDia}</div>
                    <div className="weekly-stat-lbl">Mamadas / Dia</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#f59e0b' }}><Award size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.maxDia.totalMl} <span className="stat-unit">ml</span></div>
                    <div className="weekly-stat-lbl">Dia de Pico ({relatorio.maxDia.dayLabel})</div>
                  </div>
                </div>

                {/* Gráfico de Barras dos 7 Dias */}
                <div className="weekly-chart-card">
                  <h3 className="chart-title">Consumo Diário (desde 05/08)</h3>
                  <div className="bars-container">
                    {relatorio.dias.map(d => {
                      const heightPct = Math.round((d.totalMl / relatorio.maxMlGraph) * 100);
                      const isMax = d.dateStr === relatorio.maxDia.dateStr && d.totalMl > 0;
                      return (
                        <div key={d.dateStr} className="bar-column">
                          <div className="bar-val">{d.totalMl > 0 ? `${d.totalMl}` : ''}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${isMax ? 'max-bar' : ''}`}
                              style={{ height: `${Math.max(heightPct, 6)}%` }}
                              title={`${d.totalMl} ml (${d.count} mamadas)`}
                            />
                          </div>
                          <div className="bar-label">{d.dayLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela Detalhada por Dia */}
                <div className="weekly-table-card">
                  <h3 className="chart-title">Detalhamento por Dia</h3>
                  <div className="weekly-table-wrapper">
                    <table className="weekly-table">
                      <thead>
                        <tr>
                          <th>Dia / Data</th>
                          <th>Total (ml)</th>
                          <th>N.º Mamadas</th>
                          <th className="hide-mobile">Média / Mamada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.slice().reverse().map(d => (
                          <tr key={d.dateStr}>
                            <td><strong>{d.dayFullLabel}</strong></td>
                            <td><span className="badge-ml">{d.totalMl} ml</span></td>
                            <td>{d.count} mamadas</td>
                            <td className="hide-mobile">{d.avgMl > 0 ? `${d.avgMl} ml` : '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Modal de Relatório Semanal de Fraldas */}
      {mostrarRelatorioFraldas && (() => {
        const relatorio = getDadosRelatorioFraldas();
        return createPortal(
          <div className="modal-overlay" onClick={() => setMostrarRelatorioFraldas(false)}>
            <div className="modal-card weekly-report-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <h2 className="modal-title">Relatório Semanal de Fraldas</h2>
                    <p className="modal-subtitle">
                      {relatorio.numDiasValidos < 7
                        ? `Resumo dos registos (desde 05/08 · ${relatorio.numDiasValidos} ${relatorio.numDiasValidos === 1 ? 'dia' : 'dias'})`
                        : 'Resumo dos últimos 7 dias da Sofia'}
                    </p>
                  </div>
                </div>
                <button className="btn-action-close" onClick={() => setMostrarRelatorioFraldas(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* 4 Cards de Métricas */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#0284c7' }}><TrendingUp size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaDiariaFraldas}</div>
                    <div className="weekly-stat-lbl">Média / Dia</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#0284c7' }}><Sparkles size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalXixi}</div>
                    <div className="weekly-stat-lbl">Trocas com Xixi 💧</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#c2410c' }}><Sparkles size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalCoco}</div>
                    <div className="weekly-stat-lbl">Trocas com Cocó 💩</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#f59e0b' }}><Award size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.maxDia.countTotal}</div>
                    <div className="weekly-stat-lbl">Dia de Pico ({relatorio.maxDia.dayLabel})</div>
                  </div>
                </div>

                {/* Gráfico de Barras dos 7 Dias */}
                <div className="weekly-chart-card">
                  <h3 className="chart-title">Trocas Diárias (desde 05/08)</h3>
                  <div className="bars-container">
                    {relatorio.dias.map(d => {
                      const heightPct = Math.round((d.countTotal / relatorio.maxFraldasGraph) * 100);
                      const isMax = d.dateStr === relatorio.maxDia.dateStr && d.countTotal > 0;
                      return (
                        <div key={d.dateStr} className="bar-column">
                          <div className="bar-val">{d.countTotal > 0 ? `${d.countTotal}` : ''}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill bar-fill-diaper ${isMax ? 'max-bar' : ''}`}
                              style={{ height: `${Math.max(heightPct, 6)}%` }}
                              title={`${d.countTotal} fraldas (💧${d.countXixi} | 💩${d.countCoco} | 🧻${d.countAmbos})`}
                            />
                          </div>
                          <div className="bar-label">{d.dayLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela Detalhada por Dia */}
                <div className="weekly-table-card">
                  <h3 className="chart-title">Detalhamento por Dia</h3>
                  <div className="weekly-table-wrapper">
                    <table className="weekly-table">
                      <thead>
                        <tr>
                          <th>Dia / Data</th>
                          <th>Total Fraldas</th>
                          <th>Xixi 💧</th>
                          <th>Cocó 💩</th>
                          <th className="hide-mobile">Ambos 🧻</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.slice().reverse().map(d => (
                          <tr key={d.dateStr}>
                            <td><strong>{d.dayFullLabel}</strong></td>
                            <td><span className="badge-diaper">{d.countTotal} fraldas</span></td>
                            <td>{d.countXixi + d.countAmbos}</td>
                            <td>{d.countCoco + d.countAmbos}</td>
                            <td className="hide-mobile">{d.countAmbos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Modal de Relatório Semanal de Sonos */}
      {mostrarRelatorioSonos && (() => {
        const relatorio = getDadosRelatorioSonos();
        return createPortal(
          <div className="modal-overlay" onClick={() => setMostrarRelatorioSonos(false)}>
            <div className="modal-card weekly-report-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <div className="icon-badge-glow" style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}>
                    <BarChart2 size={22} />
                  </div>
                  <div>
                    <h2 className="modal-title">Relatório Semanal de Sonos</h2>
                    <p className="modal-subtitle">
                      {relatorio.numDiasValidos < 7
                        ? `Resumo dos registos (desde 05/08 · ${relatorio.numDiasValidos} ${relatorio.numDiasValidos === 1 ? 'dia' : 'dias'})`
                        : 'Resumo dos últimos 7 dias da Sofia'}
                    </p>
                  </div>
                </div>
                <button className="btn-action-close" onClick={() => setMostrarRelatorioSonos(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {/* Cards de Métricas */}
                <div className="weekly-stats-grid">
                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#8b5cf6' }}><TrendingUp size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.mediaDiariaFormatada}</div>
                    <div className="weekly-stat-lbl">Média / Dia</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#8b5cf6' }}><Clock size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.totalSemanalSestas}</div>
                    <div className="weekly-stat-lbl">Sestas na Semana</div>
                  </div>

                  <div className="weekly-stat-card">
                    <div className="weekly-stat-icon" style={{ color: '#f59e0b' }}><Award size={18} /></div>
                    <div className="weekly-stat-val">{relatorio.maxDia.totalFormatado}</div>
                    <div className="weekly-stat-lbl">Dia de Pico ({relatorio.maxDia.dayLabel})</div>
                  </div>
                </div>

                {/* Gráfico de Barras dos 7 Dias */}
                <div className="weekly-chart-card">
                  <h3 className="chart-title">Sonos Diários (desde 05/08)</h3>
                  <div className="bars-container">
                    {relatorio.dias.map(d => {
                      const heightPct = Math.round((d.totalMinutos / relatorio.maxMinutosGraph) * 100);
                      const isMax = d.dateStr === relatorio.maxDia.dateStr && d.totalMinutos > 0;
                      return (
                        <div key={d.dateStr} className="bar-column">
                          <div className="bar-val">{d.totalMinutos > 0 ? d.totalFormatado.replace(' ', '') : ''}</div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${isMax ? 'max-bar' : ''}`}
                              style={{ height: `${Math.max(heightPct, 6)}%`, background: isMax ? 'linear-gradient(to top, #8b5cf6, #c084fc)' : '#c4b5fd' }}
                              title={`${d.totalFormatado} (${d.numSestas} sestas)`}
                            />
                          </div>
                          <div className="bar-label">{d.dayLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabela Detalhada por Dia */}
                <div className="weekly-table-card">
                  <h3 className="chart-title">Detalhamento por Dia</h3>
                  <div className="weekly-table-wrapper">
                    <table className="weekly-table">
                      <thead>
                        <tr>
                          <th>Dia / Data</th>
                          <th>Tempo Total</th>
                          <th>N.º Sestas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorio.dias.slice().reverse().map(d => (
                          <tr key={d.dateStr}>
                            <td><strong>{d.dayFullLabel}</strong></td>
                            <td><span className="badge-ml" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>{d.totalFormatado}</span></td>
                            <td>{d.numSestas} sestas</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Modal Nova Lata de Leite */}
      {modalLataAberta && createPortal(
        <div className="modal-overlay" onClick={fecharModalLata}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editandoIdLata ? 'Editar Lata' : 'Abrir Nova Lata'}</h2>
              <button className="btn-action-close" onClick={fecharModalLata}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body form-grid">
              <div className="form-group">
                <label>Fórmula (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Aptamil Profutura"
                  className="input-field"
                  value={nomeLata}
                  onChange={(e) => setNomeLata(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Data de Abertura</label>
                  <input
                    type="date"
                    className="input-field"
                    value={dataLata}
                    onChange={(e) => setDataLata(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Hora</label>
                  <input
                    type="time"
                    className="input-field"
                    value={horaLata}
                    onChange={(e) => setHoraLata(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn-primary" onClick={salvarLata} style={{ marginTop: '0.5rem' }}>
                {editandoIdLata ? 'Guardar Alterações' : 'Registar Abertura'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Leite;
