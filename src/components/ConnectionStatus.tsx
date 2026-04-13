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
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-[#e8dcc8]/90 tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {pair.toUpperCase().replace('USDT', '/USDT')}
      </span>
      <button
        onClick={state !== 'connected' ? onReconnect : undefined}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${c.bg} border border-[#c4956a]/10 transition-all hover:border-[#c4956a]/20 ${
          state !== 'connected' ? 'cursor-pointer' : 'cursor-default'
        }`}
        title={state !== 'connected' ? 'Click to reconnect' : 'Connected'}
        style={{ fontFamily: "'Lora', serif" }}
      >
        <span className="relative flex h-2 w-2">
          {c.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.color} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${c.color}`} />
        </span>
        {c.label}
      </button>
    </div>
  );
}
