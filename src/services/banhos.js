// Há quanto tempo foi o último banho. Conta em dias a partir de 24 h e fica "urgente" a partir de 2 dias.
export const tempoDesdeBanho = (data, hora, agora = new Date()) => {
  // o formato é validado porque o JavaScript aceita texto inválido como se fosse uma data antiga
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || '') || !/^\d{2}:\d{2}$/.test(hora || '')) return null;
  const passado = new Date(`${data}T${hora}:00`);
  if (Number.isNaN(passado.getTime())) return null;
  // Como nos outros registos: uma hora "no futuro" é, quase sempre, de ontem registada com a data de hoje
  if (passado > agora) passado.setDate(passado.getDate() - 1);

  const minutos = Math.max(0, Math.floor((agora - passado) / 60000));
  const isUrgent = minutos >= 2 * 24 * 60;

  if (minutos < 60) return { text: `${minutos} min`, isUrgent };
  if (minutos < 24 * 60) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return { text: resto === 0 ? `${horas}h` : `${horas}h ${resto}min`, isUrgent };
  }
  const dias = Math.floor(minutos / (24 * 60));
  return { text: `${dias} ${dias === 1 ? 'dia' : 'dias'}`, isUrgent };
};
