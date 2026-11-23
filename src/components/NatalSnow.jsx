import { useEffect, useRef } from 'react';

// Neve do modo Natal: um <canvas> por cima da app, sem apanhar toques.
// Dois tipos: 'estrelas' (estrelas coloridas) e 'flocos' (flocos de neve brancos em estrela).
// Desenha poucas partículas, com sprites pré-desenhados, para ser leve no telemóvel.
const CORES_ESTRELAS = [
  { fill: '#ffd35a', stroke: '#e0a21b', glow: 'rgba(255, 211, 90, 0.9)' },
  { fill: '#ffffff', stroke: 'rgba(219, 39, 119, 0.55)', glow: 'rgba(244, 114, 182, 0.8)' },
  { fill: '#e11d48', stroke: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)' },
  { fill: '#fbcfe8', stroke: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
];

// Variantes de floco: onde nascem os ramos de cada braço (fração do comprimento) e o seu tamanho
const VARIANTES_FLOCO = [
  { ramos: [0.5, 0.76], ramo: 0.3 },
  { ramos: [0.4, 0.64, 0.86], ramo: 0.22 },
  { ramos: [0.58], ramo: 0.34 },
];

// Parâmetros de movimento de cada tipo de neve
const MOVIMENTO = {
  estrelas: { tamanho: [9, 20], velocidade: [28, 70], oscilacao: [8, 26], rotacao: [-1.2, 1.2], opacidade: [0.7, 1] },
  flocos: { tamanho: [8, 18], velocidade: [22, 55], oscilacao: [14, 36], rotacao: [-0.7, 0.7], opacidade: [0.8, 1] },
};

const TAMANHO_SPRITE = 64;

function novoSprite() {
  const c = document.createElement('canvas');
  c.width = TAMANHO_SPRITE;
  c.height = TAMANHO_SPRITE;
  return c;
}

function criarSpriteEstrela(cor) {
  const c = novoSprite();
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

// Floco de neve em estrela: seis braços com ramos laterais. Primeiro um traço azul-claro mais
// largo (para se ver sobre o fundo claro), depois o traço branco por cima.
function criarSpriteFloco(variante) {
  const c = novoSprite();
  const ctx = c.getContext('2d');
  const cx = TAMANHO_SPRITE / 2;
  const cy = TAMANHO_SPRITE / 2;
  const comprimento = TAMANHO_SPRITE * 0.4;

  const desenharFloco = () => {
    for (let k = 0; k < 6; k += 1) {
      const ang = (Math.PI / 3) * k - Math.PI / 2;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx * comprimento, cy + dy * comprimento);

      variante.ramos.forEach((frac) => {
        const bx = cx + dx * comprimento * frac;
        const by = cy + dy * comprimento * frac;
        const tamanhoRamo = comprimento * variante.ramo;
        [-1, 1].forEach((lado) => {
          const angRamo = ang + lado * (Math.PI / 3);
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(angRamo) * tamanhoRamo, by + Math.sin(angRamo) * tamanhoRamo);
        });
      });
    }
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  desenharFloco();
  ctx.shadowColor = 'rgba(96, 165, 250, 0.9)';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.95)';
  ctx.lineWidth = 5.4;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  desenharFloco();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.6;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  return c;
}

const aleatorio = (min, max) => min + Math.random() * (max - min);

function novaParticula(largura, altura, noTopo, mov, totalSprites) {
  return {
    x: Math.random() * largura,
    y: noTopo ? aleatorio(-40, -10) : Math.random() * altura,
    tamanho: aleatorio(...mov.tamanho),
    velocidade: aleatorio(...mov.velocidade), // px por segundo
    oscilacao: aleatorio(...mov.oscilacao),
    fase: Math.random() * Math.PI * 2,
    velFase: aleatorio(0.5, 1.4),
    rotacao: Math.random() * Math.PI * 2,
    velRotacao: aleatorio(...mov.rotacao),
    sprite: Math.floor(Math.random() * totalSprites),
    opacidade: aleatorio(...mov.opacidade),
  };
}

const NatalSnow = ({ tipo = 'estrelas' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const mov = MOVIMENTO[tipo] || MOVIMENTO.estrelas;
    const sprites = tipo === 'flocos' ? VARIANTES_FLOCO.map(criarSpriteFloco) : CORES_ESTRELAS.map(criarSpriteEstrela);
    let largura = 0;
    let altura = 0;
    let particulas = [];
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
      particulas = Array.from({ length: total }, () => novaParticula(largura, altura, false, mov, sprites.length));
    };

    const desenhar = (agora) => {
      const dt = Math.min((agora - (ultimo || agora)) / 1000, 0.05);
      ultimo = agora;
      ctx.clearRect(0, 0, largura, altura);

      particulas.forEach((p, i) => {
        p.y += p.velocidade * dt;
        p.fase += p.velFase * dt;
        p.rotacao += p.velRotacao * dt;

        if (p.y - p.tamanho > altura) {
          particulas[i] = novaParticula(largura, altura, true, mov, sprites.length);
          return;
        }

        const x = p.x + Math.sin(p.fase) * p.oscilacao;
        ctx.save();
        ctx.globalAlpha = p.opacidade;
        ctx.translate(x, p.y);
        ctx.rotate(p.rotacao);
        const lado = p.tamanho * 2;
        ctx.drawImage(sprites[p.sprite], -lado / 2, -lado / 2, lado, lado);
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
  }, [tipo]);

  return <canvas ref={canvasRef} className="natal-snow" aria-hidden="true" />;
};

export default NatalSnow;
