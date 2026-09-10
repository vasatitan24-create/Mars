import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Crosshair, 
  Minimize2, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  MousePointerClick,
  Wifi,
  Move
} from 'lucide-react';
import { ExecutionStatus, MacroStep } from '../types';

interface FloatingAutoClickerOverlayProps {
  status: ExecutionStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onStepNext: () => void;
  activeStepIndex: number | null;
  steps: MacroStep[];
  totalClicks: number;
  currentLoop: number;
  totalLoops: number;
  isInspectorMode: boolean;
  onToggleInspector: () => void;
  onExitFullscreen: () => void;
  networkPingMs: number;
}

export const FloatingAutoClickerOverlay: React.FC<FloatingAutoClickerOverlayProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onStepNext,
  activeStepIndex,
  steps,
  totalClicks,
  currentLoop,
  totalLoops,
  isInspectorMode,
  onToggleInspector,
  onExitFullscreen,
  networkPingMs,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const activeStep = activeStepIndex !== null && steps[activeStepIndex] ? steps[activeStepIndex] : null;

  if (isMinimized) {
    return (
      <div 
        id="floating-overlay-minimized"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-2xl animate-fadeIn"
      >
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${
            status === 'running' ? 'bg-emerald-400 animate-ping' :
            status === 'paused' ? 'bg-amber-400' : 'bg-slate-400'
          }`} />
          <span className="text-xs font-mono font-bold text-white">
            {totalClicks} кл.
          </span>
        </div>

        {status === 'running' ? (
          <button
            type="button"
            onClick={onPause}
            className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
            title="Пауза"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        ) : status === 'paused' ? (
          <button
            type="button"
            onClick={onResume}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors cursor-pointer"
            title="Продолжить"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
            title="Запустить"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Развернуть пульт управления"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onExitFullscreen}
          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
          title="Выйти из полного экрана"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div 
      id="floating-overlay-controller"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[620px] bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl flex flex-col gap-2 animate-fadeIn select-none"
    >
      {/* Top row: Status, Step info, Ping, Actions */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-200">
            <span className={`w-2 h-2 rounded-full ${
              status === 'running' ? 'bg-emerald-400 animate-ping' :
              status === 'paused' ? 'bg-amber-400' : 'bg-slate-500'
            }`} />
            <span>
              {status === 'running' ? 'Автокликер активен' :
               status === 'paused' ? 'На паузе' : 'Остановлен'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Круг {currentLoop}/{totalLoops === 0 ? '∞' : totalLoops}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <MousePointerClick className="w-3 h-3 text-cyan-400" />
            <span>{totalClicks} кликов</span>
          </span>

          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-lg flex items-center gap-1 hidden sm:flex">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{networkPingMs}мс</span>
          </span>

          {/* Minimize overlay button */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Свернуть пульт в компактный вид"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Exit Fullscreen button */}
          <button
            type="button"
            onClick={onExitFullscreen}
            className="p-1 text-slate-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
            title="Выйти из полноэкранного режима"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center row: Step detail */}
      {activeStep ? (
        <div className="text-[11px] text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg flex items-center justify-between border border-slate-800/60">
          <div className="truncate flex items-center gap-1.5">
            <span className="text-blue-400 font-bold">Шаг {(activeStepIndex ?? 0) + 1}/{steps.length}:</span>
            <span className="font-medium text-slate-100 truncate">{activeStep.label}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
            {activeStep.action}
          </span>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg flex items-center justify-between border border-slate-800/60">
          <span>Готов к выполнению (Всего целей: {steps.length})</span>
          <span className="text-[10px] text-slate-500">Нажмите «Старт»</span>
        </div>
      )}

      {/* Bottom row: Play/Pause/Stop/Step/Target picker controls */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-1">
          {status === 'idle' || status === 'stopped' || status === 'completed' || status === 'error' ? (
            <button
              type="button"
              id="fullscreen-start-btn"
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Старт</span>
            </button>
          ) : status === 'running' ? (
            <button
              type="button"
              id="fullscreen-pause-btn"
              onClick={onPause}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Пауза</span>
            </button>
          ) : (
            <button
              type="button"
              id="fullscreen-resume-btn"
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Продолжить</span>
            </button>
          )}

          <button
            type="button"
            id="fullscreen-step-btn"
            onClick={onStepNext}
            className="flex items-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Выполнить следующий шаг вручную"
          >
            <SkipForward className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Шаг</span>
          </button>

          <button
            type="button"
            id="fullscreen-stop-btn"
            onClick={onStop}
            disabled={status === 'idle' || status === 'stopped'}
            className="flex items-center gap-1 py-2 px-3 bg-rose-950/50 hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/40 transition-colors cursor-pointer"
            title="Остановить"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span className="hidden sm:inline">Стоп</span>
          </button>
        </div>

        {/* Target Inspector toggle */}
        <button
          type="button"
          id="fullscreen-target-picker-btn"
          onClick={onToggleInspector}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isInspectorMode
              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 font-bold animate-pulse'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
          }`}
          title="Включить прицел для выбора элементов кликом на странице"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isInspectorMode ? 'text-slate-950 rotate-45' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">{isInspectorMode ? 'Прицел ВКЛ' : 'Выбрать цель'}</span>
        </button>
      </div>
    </div>
  );
};
