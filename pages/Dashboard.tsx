import React, { useMemo, useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card } from '../components/UIComponents';
import { PeriodFilter, PipelineStage, LeadSourceLabels } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Bar, Line, Legend, ReferenceLine
} from 'recharts';
import { 
  ArrowUpRight, DollarSign, Users, Trophy, TrendingUp, 
  BarChart3, MoreHorizontal, Filter, Calendar, Activity
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// --- Components Premium ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-700 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 min-w-[200px]">
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm mb-2 last:mb-0">
            <div className="flex items-center gap-2">
               <div 
                  className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]" 
                  style={{ backgroundColor: entry.stroke || entry.fill, boxShadow: `0 0 10px ${entry.stroke || entry.fill}` }} 
               />
               <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-zinc-900 dark:text-white text-base font-mono">
              {entry.name.includes('Valor') || entry.name.includes('Receita') 
                ? `R$ ${Number(entry.value).toLocaleString()}` 
                : entry.name.includes('Taxa') || entry.name.includes('Conversão')
                  ? `${entry.value}%`
                  : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { leads, isLoading } = useCRM();
  const [period, setPeriod] = useState<PeriodFilter>('30days');
  const { isDarkMode } = useTheme();

  // --- Lógica de Filtro Precisa (Local Time) ---
  const filteredLeads = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    return leads.filter(lead => {
      if (!lead.createdAt) return false;
      const leadDate = new Date(lead.createdAt);
      if (isNaN(leadDate.getTime())) return false;

      const leadTime = leadDate.getTime();

      switch (period) {
        case 'today': return leadTime >= todayStart;
        case '7days': return leadTime >= (todayStart - (7 * ONE_DAY));
        case '30days': return leadTime >= (todayStart - (30 * ONE_DAY));
        case 'total': default: return true;
      }
    });
  }, [leads, period]);

  // --- KPIs ---
  const kpis = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const wonLeads = filteredLeads.filter(l => l.stage === PipelineStage.VENDA_FEITA);
    const wonCount = wonLeads.length;
    const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0.0';
    const wonValue = wonLeads.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    return [
      { 
        label: 'Total de Leads', 
        value: totalLeads, 
        icon: Users, 
        color: 'text-indigo-600 dark:text-indigo-400', 
        bg: 'bg-indigo-50 dark:bg-indigo-500/10',
        trendUp: true
      },
      { 
        label: 'Taxa de Conversão', 
        value: `${conversionRate}%`, 
        icon: TrendingUp, 
        color: 'text-violet-600 dark:text-violet-400', 
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        trendUp: true
      },
      { 
        label: 'Negócios Fechados', 
        value: wonCount, 
        icon: Trophy, 
        color: 'text-amber-600 dark:text-amber-400', 
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        trendUp: true
      },
      { 
        label: 'Receita Gerada', 
        value: `R$ ${wonValue.toLocaleString()}`, 
        icon: DollarSign, 
        color: 'text-emerald-600 dark:text-emerald-400', 
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        trendUp: true
      },
    ];
  }, [filteredLeads]);

  // --- Dados dos Gráficos ---
  const areaChartData = useMemo(() => {
    const dataMap: Record<string, { dateFull: number; label: string; leads: number; won: number }> = {};
    
    filteredLeads.forEach(lead => {
      const d = new Date(lead.createdAt);
      if (isNaN(d.getTime())) return;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`; 
      
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

      if (!dataMap[key]) {
        const dateFull = new Date(year, d.getMonth(), d.getDate()).getTime();
        dataMap[key] = { dateFull, label, leads: 0, won: 0 };
      }
      
      dataMap[key].leads += 1;
      if (lead.stage === PipelineStage.VENDA_FEITA) dataMap[key].won += 1;
    });

    return Object.values(dataMap).sort((a, b) => a.dateFull - b.dateFull);
  }, [filteredLeads]);

  const composedChartData = useMemo(() => {
    const data: Record<string, { name: string; total: number; won: number; conversion: number }> = {};
    filteredLeads.forEach(lead => {
      const label = LeadSourceLabels[lead.source] || lead.source || 'Outros';
      if (!data[label]) data[label] = { name: label, total: 0, won: 0, conversion: 0 };
      data[label].total += 1;
      if (lead.stage === PipelineStage.VENDA_FEITA) data[label].won += 1;
    });

    return Object.values(data)
      .map(item => ({
        ...item,
        conversion: item.total > 0 ? Number(((item.won / item.total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredLeads]);

  // --- Styles ---
  const gridColor = isDarkMode ? "#3f3f46" : "#e4e4e7"; 
  const axisColor = isDarkMode ? "#a1a1aa" : "#71717a"; 

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8 p-4">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 w-1/4 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="h-[400px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
           <div className="h-[400px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Dashboard
          </h2>
          <div className="flex items-center gap-2 mt-2 text-zinc-500 dark:text-zinc-400">
             <Calendar className="w-4 h-4" />
             <span className="text-sm">Visão geral de desempenho</span>
          </div>
        </div>
        
        <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center border border-zinc-200 dark:border-zinc-800">
          {(['today', '7days', '30days', 'total'] as PeriodFilter[]).map((p) => {
             const labels: Record<string, string> = { 
               today: 'Hoje', 
               '7days': '7 Dias', 
               '30days': '30 Dias', 
               total: 'Geral' 
             };
             const isActive = period === p;
             return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 relative ${
                  isActive 
                    ? 'text-zinc-900 dark:text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 z-0" />
                )}
                <span className="relative z-10">{labels[p]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="p-6 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-zinc-100 dark:border-zinc-800 group">
            {/* Background Glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${
               idx === 0 ? 'from-indigo-500/20' : idx === 1 ? 'from-violet-500/20' : idx === 2 ? 'from-amber-500/20' : 'from-emerald-500/20'
            } to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${kpi.bg} ring-1 ring-inset ring-black/5`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              {kpi.trendUp && (
                <div className="flex items-center text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100 dark:border-emerald-500/20">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  +0.0%
                </div>
              )}
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{kpi.value}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: GLOWING AREA CHART */}
        <Card className="p-0 overflow-hidden flex flex-col h-[480px] shadow-lg shadow-indigo-500/5 border border-zinc-100 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-50 dark:border-zinc-800/50 flex justify-between items-center bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                 <Activity className="w-5 h-5 text-indigo-500" />
                 Fluxo de Oportunidades
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Tendência de entrada vs. fechamento</p>
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full min-h-0 pt-6 pr-6 pb-2 bg-gradient-to-b from-white to-indigo-50/20 dark:from-zinc-900 dark:to-zinc-900/50">
            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {/* Glow Filter */}
                    <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
                       <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                       <feMerge>
                           <feMergeNode in="coloredBlur" />
                           <feMergeNode in="SourceGraphic" />
                       </feMerge>
                    </filter>
                    <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                       <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                       <feMerge>
                           <feMergeNode in="coloredBlur" />
                           <feMergeNode in="SourceGraphic" />
                       </feMerge>
                    </filter>

                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} strokeOpacity={0.4} />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} 
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Legend 
                    iconType="circle" 
                    verticalAlign="top" 
                    align="right" 
                    height={36} 
                    iconSize={8}
                    wrapperStyle={{ top: -50, right: 20, fontSize: '12px', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    name="Leads" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                    filter="url(#glow-indigo)"
                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#6366f1' }}
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="won" 
                    name="Vendas" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorWon)" 
                    filter="url(#glow-emerald)"
                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#10b981' }}
                    animationDuration={1500}
                    animationBegin={300}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 animate-pulse">
                  <BarChart3 className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-medium">Sem dados no período</p>
              </div>
            )}
          </div>
        </Card>

        {/* CHART 2: COMPOSED CHART (BAR + LINE) */}
        <Card className="p-0 overflow-hidden flex flex-col h-[480px] shadow-lg shadow-purple-500/5 border border-zinc-100 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-50 dark:border-zinc-800/50 flex justify-between items-center bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                 <Filter className="w-5 h-5 text-purple-500" />
                 Performance por Canal
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Volume vs. Taxa de Conversão</p>
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 w-full min-h-0 pt-6 pr-6 pb-2 bg-gradient-to-b from-white to-purple-50/20 dark:from-zinc-900 dark:to-zinc-900/50">
            {composedChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={composedChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={6}>
                  <defs>
                      <linearGradient id="barGradientTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="barGradientWon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.4}/>
                      </linearGradient>
                      <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
                         <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                         <feMerge>
                             <feMergeNode in="coloredBlur" />
                             <feMergeNode in="SourceGraphic" />
                         </feMerge>
                      </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} strokeOpacity={0.4} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} 
                    dy={10}
                  />
                  {/* Left Axis: Volume */}
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }} 
                  />
                  {/* Right Axis: Conversion Rate */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#f59e0b', fontSize: 11, fontWeight: 700 }} 
                    unit="%"
                  />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                  <Legend 
                    iconType="circle" 
                    verticalAlign="top" 
                    align="right" 
                    height={36} 
                    iconSize={8}
                    wrapperStyle={{ top: -50, right: 20, fontSize: '12px', fontWeight: 600 }}
                  />
                  
                  <Bar 
                    yAxisId="left"
                    dataKey="total" 
                    name="Total" 
                    fill="url(#barGradientTotal)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={24}
                    animationDuration={1500}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="won" 
                    name="Vendas" 
                    fill="url(#barGradientWon)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={24}
                    animationDuration={1500}
                    animationBegin={200}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="conversion" 
                    name="Conversão" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#18181b', stroke: '#f59e0b' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
                    filter="url(#glow-line)"
                    animationDuration={2000}
                    animationBegin={500}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 animate-pulse">
                   <BarChart3 className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-medium">Sem dados de origem</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;