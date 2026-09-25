import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Brand-only palette: pink → violet plus their alpha steps (no new hues).
export const SERIES = ['#FF3F8E', '#8747FF', '#B592FF', '#FF8FBE', '#5B2FB8', '#C42A6A'];
const AXIS = { fill: '#8E879A', fontSize: 11 };
const TIP = { background: '#1D1621', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, color: '#F7F4F8', fontSize: 12 };

export function TimeSeries({ data, color = '#FF3F8E', height = 220 }: { data: { date: string; value: number }[]; color?: string; height?: number }) {
  const id = `g${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -20, right: 4, top: 6 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TIP} cursor={{ stroke: 'rgba(255,255,255,.15)' }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HBars({ data, height }: { data: { label: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(120, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: '#CFC8D6' }} axisLine={false} tickLine={false} width={96} />
        <Tooltip contentStyle={TIP} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#FF3F8E" barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBars({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -20, right: 4 }}>
        <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TIP} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#8747FF" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, b) => a + Number(b.value), 0) || 1;
  return (
    <div className="flex items-center gap-5">
      <div className="w-[150px] h-[150px] shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
            </Pie>
            <Tooltip contentStyle={TIP} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-[13px] min-w-0">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SERIES[i % SERIES.length] }} />
            <span className="text-soft capitalize truncate">{String(d.label).replace(/_/g, ' ')}</span>
            <span className="text-quiet ml-auto pl-3">{Math.round((Number(d.value) / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
