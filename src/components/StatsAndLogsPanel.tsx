import React, { useRef, useEffect } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  Activity, 
  MousePointer, 
  RotateCw, 
  Gauge,
  Clock
} from 'lucide-react';
import { ExecutionStats, LogEntry } from '../types';

interface StatsAndLogsPanelProps {
  stats: ExecutionStats;
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const StatsAndLogsPanel: React.FC<StatsAndLogsPanelProps> = ({
  stats,
  logs,
  onClearLogs,
}) => {
  const [copied, setCopied] = React.useState(false);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom on new entries
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      id="stats-and-logs-panel"
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full"
    >
      {/* Live Stats Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        {/* Total Clicks */}
        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <MousePointer className="w-3 h-3 text-blue-400" />
            <span>Кликов</span>
          </div>
          <div id="stat-total-clicks" className="text-base font-extrabold text-blue-400 font-mono">
            {stats.totalClicks}
          </div>
        </div>

        {/* Current Loop */}
        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <RotateCw className="w-3 h-3 text-purple-400" />
            <span>Цикл</span>
          </div>
          <div id="stat-current-loop" className="text-base font-extrabold text-purple-400 font-mono">
            {stats.currentLoop} <span className="text-xs text-slate-500 font-normal">/ {stats.totalLoops === 0 ? '∞' : stats.totalLoops}</span>
          </div>
        </div>

        {/* Time Elapsed */}
        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Время</span>
          </div>
          <div id="stat-time-elapsed" className="text-base font-extrabold text-emerald-400 font-mono">
            {formatSeconds(stats.elapsedSeconds)}
          </div>
        </div>

        {/* Speed: Clicks / Minute */}
        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[11px] mb-0.5">
            <Gauge className="w-3 h-3 text-amber-400" />
            <span>Скорость</span>
          </div>
          <div id="stat-speed-rate" className="text-base font-extrabold text-amber-400 font-mono">
            {stats.clicksPerMinute} <span className="text-[10px] text-slate-500 font-normal">клик/мин</span>
          </div>
        </div>
      </div>

      {/* Terminal Logs Header */}
      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <span>Журнал действий автокликера</span>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-850 px-1.5 py-0.2 rounded">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-xs transition-colors cursor-pointer disabled:opacity-30"
            title="Скопировать логи"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded text-xs transition-colors cursor-pointer disabled:opacity-30"
            title="Очистить журнал"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Logs Content */}
      <div 
        ref={logScrollRef}
        id="autoclicker-logs-container"
        className="flex-1 overflow-y-auto p-3 bg-slate-950 font-mono text-[11px] space-y-1 select-text"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
            Логи выполнения появятся при запуске макроса...
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            return (
              <div 
                key={log.id} 
                className="flex items-start gap-2 leading-tight hover:bg-slate-900/60 p-0.5 rounded transition-colors"
              >
                <span className="text-slate-500 shrink-0 select-none">[{timeStr}]</span>
                <span className={`shrink-0 font-bold ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-amber-400' :
                  'text-blue-400'
                }`}>
                  {log.type === 'success' ? '✔' :
                   log.type === 'error' ? '✖' :
                   log.type === 'warning' ? '⚠' : 'ℹ'}
                </span>
                <span className={`break-words ${
                  log.type === 'success' ? 'text-slate-200' :
                  log.type === 'error' ? 'text-red-300' :
                  log.type === 'warning' ? 'text-amber-300' :
                  'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
