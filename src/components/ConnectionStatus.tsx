import type { ConnectionState } from '../types/trading';

interface ConnectionStatusProps {
  state: ConnectionState;
  pair: string;
  onReconnect: () => void;
}

export default function ConnectionStatus({ state, pair, onReconnect }: ConnectionStatusProps) {
  const config: Record<ConnectionState, { color: string; bg: string; label: string; pulse: boolean }> = {
    connected: { color: 'bg-[#7d9b6f]', bg: 'bg-[#7d9b6f]/10', label: 'Telegraph Active', pulse: true },
    connecting: { color: 'bg-[#c4956a]', bg: 'bg-[#c4956a]/10', label: 'Tuning in...', pulse: true },
    disconnected: { color: 'bg-[#b5594e]', bg: 'bg-[#b5594e]/10', label: 'Wire Down', pulse: false },
    error: { color: 'bg-[#b5594e]', bg: 'bg-[#b5594e]/10', label: 'No Signal', pulse: false },
  };

  const c = config[state];

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <span className="text-xs sm:text-sm font-semibold text-[#e8dcc8]/90 tracking-wide truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {pair.toUpperCase().replace('USDT', '/USDT')}
      </span>
      <button
        onClick={state !== 'connected' ? onReconnect : undefined}
        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium ${c.bg} border border-[#c4956a]/10 transition-all hover:border-[#c4956a]/20 flex-shrink-0 ${
          state !== 'connected' ? 'cursor-pointer' : 'cursor-default'
        }`}
        title={state !== 'connected' ? 'Click to reconnect' : c.label}
        aria-label={c.label}
        style={{ fontFamily: "'Lora', serif" }}
      >
        <span className="relative flex h-2 w-2">
          {c.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.color} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${c.color}`} />
        </span>
        <span className="hidden sm:inline">{c.label}</span>
      </button>
    </div>
  );
}
