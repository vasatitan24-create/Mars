import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Zap, 
  Clock, 
  Wifi, 
  Repeat, 
  Sliders, 
  Activity,
  Sparkles
} from 'lucide-react';
import { MacroConfig, ExecutionStatus } from '../types';

interface ControlsBarProps {
  config: MacroConfig;
  onUpdateConfig: (updates: Partial<MacroConfig>) => void;
  status: ExecutionStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStepNext: () => void;
  networkPingMs: number;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  config,
  onUpdateConfig,
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onStepNext,
  networkPingMs,
}) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isExecuting = isRunning || isPaused;

  const getPingColor = (ms: number) => {
    if (ms <= 60) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (ms <= 150) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (ms <= 300) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div 
      id="main-controls-bar"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-3"
    >
      {/* Top Row: Playback Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Main Execution Controls */}
        <div className="flex items-center gap-2">
          {!isExecuting ? (
            <button
              id="start-autoclicker-btn"
              type="button"
              onClick={onStart}
              disabled={config.steps.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Запустить кликер</span>
            </button>
          ) : isRunning ? (
            <button
              id="pause-autoclicker-btn"
              type="button"
              onClick={onPause}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Пауза</span>
            </button>
          ) : (
            <button
              id="resume-autoclicker-btn"
              type="button"
              onClick={onResume}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Продолжить</span>
            </button>
          )}

          {isExecuting && (
            <button
              id="stop-autoclicker-btn"
              type="button"
              onClick={onStop}
              className="px-4 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Стоп</span>
            </button>
          )}

          <button
            id="step-forward-autoclicker-btn"
            type="button"
            onClick={onStepNext}
            disabled={isRunning || config.steps.length === 0}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40"
            title="Выполнить следующий 1 шаг макроса вручную"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Шаг</span>
          </button>
        </div>

        {/* Live Internet / Ping Monitor */}
        <div className="flex items-center gap-2">
          <div 
            id="network-latency-indicator"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold ${getPingColor(networkPingMs)}`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{networkPingMs} мс</span>
            <span className="text-[10px] opacity-80">
              {networkPingMs <= 80 ? '• Скоростной' : networkPingMs <= 200 ? '• Стабильный' : '• Медленный'}
            </span>
          </div>
        </div>
      </div>

      {/* Second Row: Mode Selection & Timing Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
        {/* 1. Timing Mode Selector: Fixed vs Adaptive (Internet speed) */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-medium block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Режим тайминга:
            </span>
            {config.timingMode === 'adaptive' && (
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.2 rounded">
                Умный подбор
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              id="mode-fixed-btn"
              onClick={() => onUpdateConfig({ timingMode: 'fixed' })}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                config.timingMode === 'fixed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Фиксированный</span>
            </button>

            <button
              type="button"
              id="mode-adaptive-btn"
              onClick={() => onUpdateConfig({ timingMode: 'adaptive' })}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                config.timingMode === 'adaptive'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Под скорость сети</span>
            </button>
          </div>
        </div>

        {/* 2. Intervals & Speed Settings depending on selected mode */}
        <div className="space-y-1.5">
          {config.timingMode === 'fixed' ? (
            <>
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span>Интервал между кликами:</span>
                <span className="font-mono text-blue-400 font-bold">
                  {config.fixedIntervalMs} мс
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="slider-fixed-interval"
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={config.fixedIntervalMs}
                  onChange={(e) => onUpdateConfig({ fixedIntervalMs: Number(e.target.value) })}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>100 мс (быстро)</span>
                <span>1000 мс</span>
                <span>5000 мс</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Множитель адаптации:
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {config.adaptiveSettings.speedMultiplier}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="slider-adaptive-multiplier"
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={config.adaptiveSettings.speedMultiplier}
                  onChange={(e) => onUpdateConfig({
                    adaptiveSettings: {
                      ...config.adaptiveSettings,
                      speedMultiplier: Number(e.target.value)
                    }
                  })}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5x (осторожно)</span>
                <span>1.0x (норма)</span>
                <span>2.5x (агрессивно)</span>
              </div>
            </>
          )}
        </div>

        {/* 3. Loop Count (Cycles) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-purple-400" />
              Количество циклов:
            </span>
            <span className="font-mono text-purple-400 font-bold">
              {config.loopCount === 0 ? '∞ Бесконечно' : `${config.loopCount} раз`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateConfig({ loopCount: 1 })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                config.loopCount === 1
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              1 раз
            </button>
            <button
              type="button"
              onClick={() => onUpdateConfig({ loopCount: 5 })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                config.loopCount === 5
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              5
            </button>
            <button
              type="button"
              onClick={() => onUpdateConfig({ loopCount: 20 })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                config.loopCount === 20
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              20
            </button>
            <button
              type="button"
              onClick={() => onUpdateConfig({ loopCount: 0 })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                config.loopCount === 0
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Выполнять макрос бесконечно, пока не нажат Стоп"
            >
              ∞
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
