import type { PnLStats } from '../types/trading';

interface PnLTrackerProps {
  stats: PnLStats;
}

export default function PnLTracker({ stats }: PnLTrackerProps) {
  const items = [
    {
      label: 'Followed',
      value: stats.followedTrades > 0 ? `${stats.totalTrades} closed` : '0',
      sub: stats.activeFollowed > 0 ? `${stats.activeFollowed} active` : undefined,
      color: 'text-[#e8dcc8]',
    },
    {
      label: 'Win Rate',
      value: stats.totalTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—',
      sub: undefined,
      color: stats.winRate >= 60 ? 'text-[#7d9b6f]' : stats.winRate >= 40 ? 'text-[#c4956a]' : stats.totalTrades > 0 ? 'text-[#b5594e]' : 'text-[#e8dcc8]',
    },
    {
      label: 'W / L',
      value: `${stats.wins} / ${stats.losses}`,
      sub: undefined,
      color: 'text-[#e8dcc8]',
    },
    {
      label: 'Total P&L',
      value: stats.totalPnlPercent !== 0 ? `${stats.totalPnlPercent > 0 ? '+' : ''}${stats.totalPnlPercent.toFixed(2)}%` : '—',
      sub: undefined,
      color: stats.totalPnlPercent > 0 ? 'text-[#7d9b6f]' : stats.totalPnlPercent < 0 ? 'text-[#b5594e]' : 'text-[#e8dcc8]',
    },
    {
      label: 'Best / Worst',
      value: stats.bestTrade !== 0 || stats.worstTrade !== 0
        ? `${stats.bestTrade > 0 ? '+' : ''}${stats.bestTrade.toFixed(1)}%`
        : '—',
      sub: stats.worstTrade !== 0 ? `${stats.worstTrade.toFixed(1)}%` : undefined,
      color: 'text-[#c4956a]',
    },
  ];

  return (
    <div className="rounded-xl bg-[#231f18]/60 border border-[#c4956a]/10 p-4">
      <div className="grid grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-[#6d6354] mb-1" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '0.15em' }}>
              {item.label}
            </div>
            <div className={`text-base font-bold tabular-nums ${item.color}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {item.value}
            </div>
            {item.sub && (
              <div className="text-[9px] text-[#6d6354] mt-0.5">{item.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
