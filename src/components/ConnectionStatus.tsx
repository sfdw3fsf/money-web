import type { ConnectionState } from '../types/trading';

interface ConnectionStatusProps {
  state: ConnectionState;
  pair: string;
  onReconnect: () => void;
}

export default function ConnectionStatus({ state, pair, onReconnect }: ConnectionStatusProps) {
  const config: Record<ConnectionState, { color: string; bg: string; label: string; pulse: boolean }> = {
    connected: { color: 'bg-emerald-400', bg: 'bg-emerald-400/10', label: 'Live', pulse: true },
    connecting: { color: 'bg-amber-400', bg: 'bg-amber-400/10', label: 'Connecting...', pulse: true },
    disconnected: { color: 'bg-red-400', bg: 'bg-red-400/10', label: 'Disconnected', pulse: false },
    error: { color: 'bg-red-500', bg: 'bg-red-500/10', label: 'Error', pulse: false },
  };

  const c = config[state];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-white/90 tracking-wide">
        {pair.toUpperCase().replace('USDT', '/USDT')}
      </span>
      <button
        onClick={state !== 'connected' ? onReconnect : undefined}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${c.bg} border border-white/[0.06] transition-all hover:border-white/[0.12] ${
          state !== 'connected' ? 'cursor-pointer' : 'cursor-default'
        }`}
        title={state !== 'connected' ? 'Click to reconnect' : 'Connected'}
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
