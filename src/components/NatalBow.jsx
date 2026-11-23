// Laço de cetim rosa do modo Natal (decorativo). O nó fica no centro da fita que
// contorna a barra inferior: os laços assentam na fita e as pontas caem sobre a barra.
const NatalBow = () => (
  <svg className="natal-bow" viewBox="0 0 120 60" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="bowLoop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbcfe8" />
        <stop offset="0.4" stopColor="#f472b6" />
        <stop offset="0.75" stopColor="#db2777" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="bowTail" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f9a8d4" />
        <stop offset="0.5" stopColor="#ec4899" />
        <stop offset="1" stopColor="#be185d" />
      </linearGradient>
      <linearGradient id="bowKnot" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fbcfe8" />
        <stop offset="0.45" stopColor="#ec4899" />
        <stop offset="1" stopColor="#be185d" />
      </linearGradient>
      <filter id="bowShadow" x="-20%" y="-30%" width="140%" height="170%">
        <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#9d174d" floodOpacity="0.45" />
      </filter>
    </defs>

    <g filter="url(#bowShadow)">
      {/* Pontas da fita, com corte em V, a cair sobre a barra */}
      <path d="M55 28 C53 35 48 40 43 44 L51 43 L54 47 C56 41 58 36 59 31 Z" fill="url(#bowTail)" />
      <path d="M65 28 C67 35 72 40 77 44 L69 43 L66 47 C64 41 62 36 61 31 Z" fill="url(#bowTail)" />
      <path d="M54 32 C52 37 49 40 46 42.5" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />
      <path d="M66 32 C68 37 71 40 74 42.5" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" strokeLinecap="round" />

      {/* Laços: nascem do nó e assentam na fita */}
      <path d="M55 23 C45 6 10 2 6 17 C3 32 40 33 55 27 Z" fill="url(#bowLoop)" />
      <path d="M65 23 C75 6 110 2 114 17 C117 32 80 33 65 27 Z" fill="url(#bowLoop)" />

      {/* Interior da fita (profundidade) */}
      <path d="M51 23 C43 11 20 9 17 18 C15 27 38 28 51 26 Z" fill="#9d174d" fillOpacity="0.42" />
      <path d="M69 23 C77 11 100 9 103 18 C105 27 82 28 69 26 Z" fill="#9d174d" fillOpacity="0.42" />

      {/* Reflexos de cetim */}
      <path d="M53 20 C44 8 18 6 11 16" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M67 20 C76 8 102 6 109 16" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 25 C20 31 38 32 50 28" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M108 25 C100 31 82 32 70 28" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.1" strokeLinecap="round" />

      {/* Nó central, sobre a fita */}
      <rect x="51" y="16" width="18" height="17" rx="7" fill="url(#bowKnot)" />
      <path d="M55 21 C58 18.5 62 18.5 65 21" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M54 29 C57 31.5 63 31.5 66 29" fill="none" stroke="#9d174d" strokeOpacity="0.35" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  </svg>
);

export default NatalBow;
