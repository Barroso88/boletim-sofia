import { useEffect, useRef } from 'react';

// Neve de estrelas do modo Natal: um <canvas> por cima da app, sem apanhar toques.
// Desenha poucas estrelas (sprites pré-desenhados) para ser leve no telemóvel.
const CORES = [
  { fill: '#ffd35a', stroke: '#e0a21b', glow: 'rgba(255, 211, 90, 0.9)' },
  { fill: '#ffffff', stroke: 'rgba(219, 39, 119, 0.55)', glow: 'rgba(244, 114, 182, 0.8)' },
  { fill: '#e11d48', stroke: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)' },
  { fill: '#fbcfe8', stroke: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
];

const TAMANHO_SPRITE = 64;

function criarSprite(cor) {
  const c = document.createElement('canvas');
  c.width = TAMANHO_SPRITE;
  c.height = TAMANHO_SPRITE;
  const ctx = c.getContext('2d');
  const cx = TAMANHO_SPRITE / 2;
  const cy = TAMANHO_SPRITE / 2;
  const raioExterior = TAMANHO_SPRITE * 0.34;
  const raioInterior = raioExterior * 0.46;

  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const raio = i % 2 === 0 ? raioExterior : raioInterior;
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(ang) * raio;
    const y = cy + Math.sin(ang) * raio;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.shadowColor = cor.glow;
  ctx.shadowBlur = 8;
  ctx.fillStyle = cor.fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = cor.stroke;
  ctx.stroke();
  return c;
}

const aleatorio = (min, max) => min + Math.random() * (max - min);

function novaEstrela(largura, altura, noTopo) {
  return {
    x: Math.random() * largura,
    y: noTopo ? aleatorio(-40, -10) : Math.random() * altura,
    tamanho: aleatorio(9, 20),
    velocidade: aleatorio(28, 70), // px por segundo
    oscilacao: aleatorio(8, 26),
    fase: Math.random() * Math.PI * 2,
    velFase: aleatorio(0.5, 1.4),
    rotacao: Math.random() * Math.PI * 2,
    velRotacao: aleatorio(-1.2, 1.2),
    sprite: Math.floor(Math.random() * CORES.length),
    opacidade: aleatorio(0.7, 1),
  };
}

const NatalSnow = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const sprites = CORES.map(criarSprite);
    let largura = 0;
    let altura = 0;
    let estrelas = [];
    let frame = 0;
    let ultimo = 0;

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = window.innerWidth;
      altura = window.innerHeight;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const total = Math.max(22, Math.min(60, Math.round(largura / 14)));
      estrelas = Array.from({ length: total }, () => novaEstrela(largura, altura, false));
    };

    const desenhar = (agora) => {
      const dt = Math.min((agora - (ultimo || agora)) / 1000, 0.05);
      ultimo = agora;
      ctx.clearRect(0, 0, largura, altura);

      estrelas.forEach((e, i) => {
        e.y += e.velocidade * dt;
        e.fase += e.velFase * dt;
        e.rotacao += e.velRotacao * dt;

        if (e.y - e.tamanho > altura) {
          estrelas[i] = novaEstrela(largura, altura, true);
          return;
        }

        const x = e.x + Math.sin(e.fase) * e.oscilacao;
        ctx.save();
        ctx.globalAlpha = e.opacidade;
        ctx.translate(x, e.y);
        ctx.rotate(e.rotacao);
        const lado = e.tamanho * 2;
        ctx.drawImage(sprites[e.sprite], -lado / 2, -lado / 2, lado, lado);
        ctx.restore();
      });

      frame = requestAnimationFrame(desenhar);
    };

    ajustar();
    frame = requestAnimationFrame(desenhar);
    window.addEventListener('resize', ajustar);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', ajustar);
    };
  }, []);

  return <canvas ref={canvasRef} className="natal-snow" aria-hidden="true" />;
};

export default NatalSnow;
