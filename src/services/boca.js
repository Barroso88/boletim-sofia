// Geometria do desenho da boca (vista de dentista): 10 dentes em cada arco.
// "Direito" e "Esquerdo" são os da bebé: o lado direito dela aparece à esquerda do ecrã.
export const VISTA = { largura: 360, altura: 480 };
const MEIO = VISTA.largura / 2;
const ARCOS = {
  u: { cy: 218, rx: 122, ry: 150, sentido: -1 },
  l: { cy: 262, rx: 122, ry: 150, sentido: 1 },
};

const ponto = ({ cy, rx, ry, sentido }, lado, t) => [MEIO + lado * rx * Math.sin(t), cy + sentido * ry * Math.cos(t)];

// Posição e inclinação do ponto a uma distância `s` do centro do arco, medida ao longo da curva.
const noArco = (arco, lado, s) => {
  let t = 0;
  let percorrido = 0;
  let anterior = ponto(arco, lado, 0);
  while (percorrido < s) {
    t += 0.002;
    const atual = ponto(arco, lado, t);
    percorrido += Math.hypot(atual[0] - anterior[0], atual[1] - anterior[1]);
    anterior = atual;
  }
  const dx = lado * arco.rx * Math.cos(t);
  const dy = -arco.sentido * arco.ry * Math.sin(t);
  let angulo = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (lado < 0) angulo += 180;
  if (arco.sentido > 0) angulo += 180; // em baixo o bordo do dente também fica virado para fora
  const [x, y] = ponto(arco, lado, t);
  return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), rot: Number(angulo.toFixed(1)) };
};

// [peça, forma, largura, altura, ordem de erupção, nome], do centro para o fundo
const FILAS = {
  u: [
    ['ic', 'inc', 34, 27, 2, 'Incisivo Central'],
    ['il', 'inc', 29, 25, 3, 'Incisivo Lateral'],
    ['c', 'can', 28, 29, 6, 'Canino'],
    ['m1', 'mol', 37, 36, 5, '1º Molar'],
    ['m2', 'mol', 40, 39, 7, '2º Molar'],
  ],
  l: [
    ['ic', 'inc', 27, 24, 1, 'Incisivo Central'],
    ['il', 'inc', 28, 24, 4, 'Incisivo Lateral'],
    ['c', 'can', 27, 28, 6, 'Canino'],
    ['m1', 'mol', 37, 36, 5, '1º Molar'],
    ['m2', 'mol', 41, 39, 7, '2º Molar'],
  ],
};

export const DENTES = Object.entries(FILAS).flatMap(([a, fila]) => {
  let distancia = 1.5;
  return fila.flatMap(([peca, tipo, w, h, order, nome]) => {
    const centro = distancia + w / 2;
    distancia += w + 4;
    return [['r', -1, 'Direito'], ['l', 1, 'Esquerdo']].map(([sufixo, lado, nomeLado]) => ({
      id: `${a}_${peca}_${sufixo}`,
      label: `${nome} ${a === 'u' ? 'Sup.' : 'Inf.'} ${nomeLado}`,
      order,
      tipo,
      w,
      h,
      ...noArco(ARCOS[a], lado, centro),
    }));
  });
});

// Linha central de cada gengiva
export const gengiva = (a) => {
  const pontos = [];
  for (let graus = -92; graus <= 92; graus += 2) {
    const [x, y] = ponto(ARCOS[a], 1, (graus * Math.PI) / 180);
    pontos.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pontos.join(' L')}`;
};

// Contorno e relevo de um dente, centrado na origem
export const forma = (tipo, w, h) => {
  const a = w / 2;
  const b = h / 2;
  if (tipo === 'inc') {
    return {
      contorno: `M${-a},${-b * 0.35} C${-a},${-b * 1.15} ${a},${-b * 1.15} ${a},${-b * 0.35} L${a * 0.82},${b * 0.55} C${a * 0.6},${b * 1.15} ${-a * 0.6},${b * 1.15} ${-a * 0.82},${b * 0.55} Z`,
      relevo: [`M${-a * 0.6},${-b * 0.45} Q0,${-b * 0.75} ${a * 0.6},${-b * 0.45}`],
    };
  }
  if (tipo === 'can') {
    return {
      contorno: `M0,${-b * 1.12} C${a * 0.55},${-b * 0.8} ${a},${-b * 0.4} ${a * 0.92},${b * 0.25} C${a * 0.85},${b} ${a * 0.35},${b * 1.05} 0,${b * 1.05} C${-a * 0.35},${b * 1.05} ${-a * 0.85},${b} ${-a * 0.92},${b * 0.25} C${-a},${-b * 0.4} ${-a * 0.55},${-b * 0.8} 0,${-b * 1.12} Z`,
      relevo: [`M${-a * 0.45},${-b * 0.1} L0,${-b * 0.55} L${a * 0.45},${-b * 0.1}`],
    };
  }
  return {
    contorno: `M${-a * 0.55},${-b} Q0,${-b * 0.8} ${a * 0.55},${-b} Q${a},${-b} ${a},${-b * 0.5} Q${a * 0.84},0 ${a},${b * 0.5} Q${a},${b} ${a * 0.55},${b} Q0,${b * 0.8} ${-a * 0.55},${b} Q${-a},${b} ${-a},${b * 0.5} Q${-a * 0.84},0 ${-a},${-b * 0.5} Q${-a},${-b} ${-a * 0.55},${-b} Z`,
    relevo: [`M${-a * 0.5},0 Q0,${b * 0.2} ${a * 0.5},0`, `M0,${-b * 0.55} Q${a * 0.15},0 0,${b * 0.55}`],
  };
};
