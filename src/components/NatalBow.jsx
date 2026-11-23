// Laço de cetim rosa do modo Natal (decorativo), colocado no topo da barra inferior.
const NatalBow = () => (
  <svg className="natal-bow" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="bowLoop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbcfe8" />
        <stop offset="0.35" stopColor="#f472b6" />
        <stop offset="0.7" stopColor="#db2777" />
        <stop offset="1" stopColor="#f472b6" />
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
      <filter id="bowShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#9d174d" floodOpacity="0.4" />
      </filter>
    </defs>

    <g filter="url(#bowShadow)">
      {/* Pontas da fita, com corte em V */}
      <path d="M54 38 C51 52 41 63 30 73 L43 70 L47 77 C53 63 57 53 59 42 Z" fill="url(#bowTail)" />
      <path d="M66 38 C69 52 79 63 90 73 L77 70 L73 77 C67 63 63 53 61 42 Z" fill="url(#bowTail)" />
      <path d="M52 44 C49 54 42 62 35 69" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M68 44 C71 54 78 62 85 69" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />

      {/* Laços (esquerdo e direito) */}
      <path d="M56 33 C44 8 8 3 5 24 C3 45 40 48 56 37 Z" fill="url(#bowLoop)" />
      <path d="M64 33 C76 8 112 3 115 24 C117 45 80 48 64 37 Z" fill="url(#bowLoop)" />

      {/* Interior da fita (profundidade) */}
      <path d="M52 32 C42 15 18 11 15 24 C14 37 39 39 52 35 Z" fill="#9d174d" fillOpacity="0.42" />
      <path d="M68 32 C78 15 102 11 105 24 C106 37 81 39 68 35 Z" fill="#9d174d" fillOpacity="0.42" />

      {/* Reflexos de cetim na borda de cima dos laços */}
      <path d="M53 28 C42 11 15 7 9 21" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M67 28 C78 11 105 7 111 21" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 33 C22 41 38 42 50 37" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M106 33 C98 41 82 42 70 37" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />

      {/* Nó central */}
      <rect x="50" y="24" width="20" height="21" rx="8" fill="url(#bowKnot)" />
      <path d="M54 29 C57 26 63 26 66 29" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M53 40 C57 43 63 43 67 40" fill="none" stroke="#9d174d" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </svg>
);

export default NatalBow;
