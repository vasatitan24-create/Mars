import React from 'react';
import { 
  Zap, 
  Smartphone, 
  FolderOpen, 
  Activity, 
  Wifi, 
  Settings,
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import { ExecutionStatus } from '../types';

interface HeaderProps {
  status: ExecutionStatus;
  savedMacrosCount: number;
  onOpenMacroManager: () => void;
  onOpenApkModal: () => void;
  networkPingMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  savedMacrosCount,
  onOpenMacroManager,
  onOpenApkModal,
  networkPingMs,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Выполняется...
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Пауза
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Готов к работе
          </span>
        );
    }
  };

  return (
    <header 
      id="app-global-header"
      className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40"
    >
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <MousePointerClick className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-100 tracking-tight">
              Web Auto Clicker
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
              v2.4 Pro
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Многоцелевой автокликер с адаптацией к скорости сети и сборкой APK
          </p>
        </div>

        <div className="ml-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Header Actions: Macro Manager & APK GitHub Build */}
      <div className="flex items-center gap-2">
        {/* Saved Macros Button */}
        <button
          id="header-macros-library-btn"
          type="button"
          onClick={onOpenMacroManager}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <FolderOpen className="w-4 h-4 text-purple-400" />
          <span>Макросы</span>
          <span className="ml-0.5 bg-slate-900 text-purple-300 font-mono text-[10px] px-1.5 py-0.2 rounded-full border border-purple-500/30">
            {savedMacrosCount}
          </span>
        </button>

        {/* GitHub APK Build Modal Trigger Button */}
        <button
          id="header-apk-build-btn"
          type="button"
          onClick={onOpenApkModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>Сборка APK (GitHub)</span>
        </button>
      </div>
    </header>
  );
};
