import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const peso = payload[0]?.value;
  const ganho = payload[1]?.value; // g/dia

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '14px 18px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)',
      border: '1px solid rgba(244,63,94,0.15)',
      minWidth: '140px',
    }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F43F5E', margin: '0 0 4px', lineHeight: 1 }}>
        {typeof peso === 'number' ? peso.toFixed(3) : '—'}
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>kg</span>
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
          {ganho > 0 ? `+${ganho}` : ganho} g/dia
        </p>
      )}
    </div>
  );
};

// ─── Main Chart Component ─────────────────────────────────────────────────────
const WeightChart = ({ chartData }) => {
  if (!chartData || chartData.length < 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', gap: '12px' }}>
        <p style={{ fontSize: '0.95rem' }}>Adicione pelo menos 2 pesagens para ver o gráfico.</p>
      </div>
    );
  }

  const weights = chartData.map(d => d.peso);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const yMin = Math.max(0, parseFloat((minW - 0.3).toFixed(2)));
  const yMax = parseFloat((maxW + 0.3).toFixed(2));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 30, right: 24, bottom: 10, left: 8 }}>
        <defs>
          {/* Gradient fill under the line */}
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
          </linearGradient>

          {/* Glowing line shadow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
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
          tickFormatter={v => `${v.toFixed(1)}`}
          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dx={-8}
          unit=" kg"
          width={60}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(244,63,94,0.2)', strokeWidth: 1, strokeDasharray: '5 4' }} />

        {/* Area fill under line */}
        <Area
          type="monotone"
          dataKey="peso"
          stroke="none"
          fill="url(#weightGradient)"
          isAnimationActive={true}
          animationDuration={1200}
        />

        {/* Main line */}
        <Line
          type="monotone"
          dataKey="peso"
          stroke="#F43F5E"
          strokeWidth={3}
          dot={{ r: 5, fill: '#fff', stroke: '#F43F5E', strokeWidth: 2.5 }}
          activeDot={{ r: 8, fill: '#F43F5E', stroke: '#fff', strokeWidth: 3 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default WeightChart;
