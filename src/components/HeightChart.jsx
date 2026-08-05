import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const dataPoint = payload[0]?.payload;
  const altura = payload[0]?.value;
  const ganho = dataPoint?.ganhoDia; // cm/dia or growth

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '14px 18px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)',
      border: '1px solid rgba(139,92,246,0.18)',
      minWidth: '140px',
    }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8B5CF6', margin: '0 0 4px', lineHeight: 1 }}>
        {typeof altura === 'number' ? altura.toFixed(1) : '—'}
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>cm</span>
      </p>
      {ganho !== undefined && ganho !== null && (
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: ganho >= 0 ? '#16a34a' : '#dc2626',
          margin: '4px 0 0',
          background: ganho >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          padding: '3px 8px',
          borderRadius: '20px',
          display: 'inline-block',
        }}>
          {ganho > 0 ? `+${ganho}` : ganho} cm/d
        </p>
      )}
    </div>
  );
};

// ─── Main Height Chart Component ──────────────────────────────────────────────
const HeightChart = ({ chartData }) => {
  if (!chartData || chartData.length < 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', gap: '12px' }}>
        <p style={{ fontSize: '0.95rem' }}>Adicione pelo menos 2 medições para ver o gráfico de altura.</p>
      </div>
    );
  }

  const heights = chartData.map(d => d.altura);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const yMin = Math.max(0, parseFloat((minH - 2).toFixed(1)));
  const yMax = parseFloat((maxH + 2).toFixed(1));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 30, right: 24, bottom: 10, left: 8 }}>
        <defs>
          <linearGradient id="heightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(0,0,0,0.04)"
          vertical={false}
          horizontal={true}
        />

        <XAxis
          dataKey="dataFormato"
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={12}
        />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={v => `${v.toFixed(0)}`}
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dx={-8}
          unit=" cm"
          width={60}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.2)', strokeWidth: 1, strokeDasharray: '5 4' }} />

        <Area
          type="monotone"
          dataKey="altura"
          stroke="none"
          fill="url(#heightGradient)"
          isAnimationActive={true}
          animationDuration={1200}
        />

        <Line
          type="monotone"
          dataKey="altura"
          stroke="#8B5CF6"
          strokeWidth={3}
          dot={{ r: 5, fill: '#fff', stroke: '#8B5CF6', strokeWidth: 2.5 }}
          activeDot={{ r: 8, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 3 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default HeightChart;
