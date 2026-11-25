import { DENTES, VISTA, gengiva, forma } from '../services/boca';

const LABIOS = 'M180,6 C286,6 354,86 354,240 C354,394 286,474 180,474 C74,474 6,394 6,240 C6,86 74,6 180,6 Z';
const INTERIOR = 'M180,24 C272,24 337,94 337,240 C337,386 272,456 180,456 C88,456 23,386 23,240 C23,94 88,24 180,24 Z';

const Dente = ({ dente, nascido, cor, onEscolher }) => {
  const { contorno, relevo } = forma(dente.tipo, dente.w, dente.h);
  return (
    <g
      className={`tooth-group${nascido ? ' erupted' : ''}`}
      data-dente={dente.id}
      role="button"
      tabIndex={0}
      aria-label={dente.label}
      onClick={() => onEscolher(dente)}
      onKeyDown={(e) => e.key === 'Enter' && onEscolher(dente)}
    >
      <g transform={`translate(${dente.x} ${dente.y}) rotate(${dente.rot})`}>
        {nascido && <path d={contorno} transform="translate(0 2.5)" className="tooth-sombra" />}
        <path d={contorno} className="tooth-el" />
        {nascido && relevo.map((linha) => <path key={linha} d={linha} className="tooth-relevo" />)}
      </g>
      {/* número da ordem de erupção, sempre direito */}
      <circle cx={dente.x} cy={dente.y} r="8.5" className="tooth-bola" style={{ fill: nascido ? cor : '#ffffff' }} />
      <text x={dente.x} y={dente.y + 3.4} className="tooth-num" style={{ fill: nascido ? '#ffffff' : cor }}>
        {dente.order}
      </text>
    </g>
  );
};

// Boca vista de dentista. `nascidos` é o registo { idDoDente: data }.
const Boca = ({ nascidos, cores, onEscolher }) => (
  <svg viewBox={`0 0 ${VISTA.largura} ${VISTA.altura}`} className="teeth-chart" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="boca-labio" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f58ea0" />
        <stop offset="1" stopColor="#e0607c" />
      </linearGradient>
      <radialGradient id="boca-fundo" cx=".5" cy=".5" r=".6">
        <stop offset="0" stopColor="#5e1628" />
        <stop offset="1" stopColor="#8e2c40" />
      </radialGradient>
      <linearGradient id="boca-lingua" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9566c" />
        <stop offset="1" stopColor="#f7919f" />
      </linearGradient>
      <linearGradient id="boca-esmalte" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#f3ebe0" />
      </linearGradient>
    </defs>

    <path d={LABIOS} fill="url(#boca-labio)" />
    <path d={INTERIOR} fill="url(#boca-fundo)" />
    <path d={gengiva('u')} className="boca-gengiva" />
    <path d={gengiva('l')} className="boca-gengiva" />

    {/* céu da boca */}
    <path d="M180,105 C228,105 260,142 262,200 C240,214 120,214 98,200 C100,142 132,105 180,105 Z" fill="#c8586c" />
    <path d="M135,142 Q180,126 225,142 M126,164 Q180,146 234,164 M122,186 Q180,170 238,186" fill="none" stroke="#e27f8f" strokeWidth="3" strokeLinecap="round" />
    {/* língua */}
    <path d="M180,380 C136,380 99,350 98,292 C98,264 130,252 180,262 C230,252 262,264 262,292 C261,350 224,380 180,380 Z" fill="url(#boca-lingua)" />
    <path d="M180,272 L180,344" stroke="#d65f74" strokeWidth="3" strokeLinecap="round" />

    <text x="180" y="196" className="svg-label-text" fill="#ffffff">EM CIMA</text>
    <text x="180" y="364" className="svg-label-text" fill="#8e2c40">EM BAIXO</text>

    {DENTES.map((dente) => (
      <Dente key={dente.id} dente={dente} nascido={!!nascidos[dente.id]} cor={cores[dente.order]} onEscolher={onEscolher} />
    ))}
  </svg>
);

export default Boca;
