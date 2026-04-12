import type { PnLStats } from '../types/trading';

interface PnLTrackerProps {
  stats: PnLStats;
}

export default function PnLTracker({ stats }: PnLTrackerProps) {
  const items = [
    {
      label: 'Followed',
      value: stats.followedTrades > 0 ? `${stats.totalTrades} closed` : '0',
      sub: stats.activeFollowed > 0 ? `${stats.activeFollowed} live` : undefined,
      color: 'text-white',
    },
    {
      label: 'Win Rate',
      value: stats.totalTrades > 0 ? `${stats.winRate.toFixed(0)}%` : '—',
      sub: undefined,
      color: stats.winRate >= 60 ? 'text-emerald-400' : stats.winRate >= 40 ? 'text-amber-400' : stats.totalTrades > 0 ? 'text-red-400' : 'text-white',
    },
    {
      label: 'W / L',
      value: `${stats.wins} / ${stats.losses}`,
      sub: undefined,
      color: 'text-white',
    },
    {
      label: 'Total P&L',
      value: stats.totalPnlPercent !== 0 ? `${stats.totalPnlPercent > 0 ? '+' : ''}${stats.totalPnlPercent.toFixed(2)}%` : '—',
      sub: undefined,
      color: stats.totalPnlPercent > 0 ? 'text-emerald-400' : stats.totalPnlPercent < 0 ? 'text-red-400' : 'text-white',
    },
    {
      label: 'Best / Worst',
      value: stats.bestTrade !== 0 || stats.worstTrade !== 0
        ? `${stats.bestTrade > 0 ? '+' : ''}${stats.bestTrade.toFixed(1)}%`
        : '—',
      sub: stats.worstTrade !== 0 ? `${stats.worstTrade.toFixed(1)}%` : undefined,
      color: 'text-indigo-400',
    },
  ];

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
      <div className="grid grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-[#5a5a6e] mb-1">
              {item.label}
            </div>
            <div className={`text-base font-bold tabular-nums ${item.color}`}>
              {item.value}
            </div>
            {item.sub && (
              <div className="text-[9px] text-[#5a5a6e] mt-0.5">{item.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
