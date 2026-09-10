import React, { useRef, useEffect, useState } from 'react';
import { 
  Globe, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  Crosshair, 
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { InteractiveSandbox } from './InteractiveSandbox';
import { PickedTargetEvent } from '../types';

interface BrowserViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  isInspectorMode: boolean;
  onToggleInspector: () => void;
  onTargetPicked: (target: PickedTargetEvent) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isPageBusy: boolean;
  activeRequests: number;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  url,
  onUrlChange,
  isInspectorMode,
  onToggleInspector,
  onTargetPicked,
  iframeRef,
  isPageBusy,
  activeRequests,
}) => {
  const [inputUrl, setInputUrl] = useState(url);
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sync inputUrl when url prop changes externally (e.g. loading macro)
  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const handleNavigate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let trimmed = inputUrl.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && trimmed !== 'sandbox') {
      trimmed = `https://${trimmed}`;
    }
    onUrlChange(trimmed);
  };

  const handleQuickSite = (newUrl: string) => {
    setInputUrl(newUrl);
    onUrlChange(newUrl);
  };

  const isUsingSandbox = !url || url === 'sandbox';

  // Toggle inspector mode inside iframe via postMessage
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'SET_INSPECTOR_MODE',
          active: isInspectorMode,
        }, '*');
      } catch (err) {
        console.error('Error sending inspector state to iframe:', err);
      }
    }
  }, [isInspectorMode, iframeRef]);

  const proxySrc = url && url !== 'sandbox' 
    ? `/api/proxy?url=${encodeURIComponent(url)}` 
    : '';

  return (
    <div 
      id="browser-view-container"
      className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Top Browser Bar */}
      <div 
        id="browser-toolbar"
        className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2"
      >
        {/* Navigation & URL input */}
        <form onSubmit={handleNavigate} className="flex items-center gap-1.5 flex-1 min-w-[260px]">
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              id="browser-back-btn"
              onClick={() => {
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.history.back();
                }
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="browser-forward-btn"
              onClick={() => {
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.history.forward();
                }
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              title="Вперед"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="browser-reload-btn"
              onClick={() => {
                if (isUsingSandbox) {
                  setIsIframeLoading(true);
                  setTimeout(() => setIsIframeLoading(false), 200);
                } else if (iframeRef.current) {
                  setIsIframeLoading(true);
                  iframeRef.current.src = proxySrc;
                }
              }}
              className={`p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ${
                isIframeLoading ? 'animate-spin text-blue-400' : ''
              }`}
              title="Перезагрузить"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* URL Input Box */}
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-2.5 text-slate-500 pointer-events-none flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <input
              id="browser-url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Введите URL сайта (напр. https://example.com) или sandbox"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-8 pr-20 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
            />
            <button
              type="submit"
              id="browser-go-btn"
              className="absolute right-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Перейти
            </button>
          </div>
        </form>

        {/* Toolbar Right Controls */}
        <div className="flex items-center gap-2">
          {/* Target Picker Toggle Button */}
          <button
            id="target-picker-toggle-btn"
            type="button"
            onClick={onToggleInspector}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isInspectorMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Включить режим прицела для выбора кнопок и ссылок кликом"
          >
            <Crosshair className={`w-4 h-4 ${isInspectorMode ? 'text-slate-950 rotate-45' : 'text-amber-400'}`} />
            <span>{isInspectorMode ? 'Прицел активен (Кликните цель)' : 'Выбрать цель'}</span>
          </button>

          {/* Device viewport switch (Mobile vs Desktop) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              id="device-mobile-btn"
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Мобильный вид (как в Android APK)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              id="device-desktop-btn"
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Широкий вид (Десктоп)"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Sites & Status Bar */}
      <div 
        id="browser-quick-sites-bar"
        className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-400 font-medium whitespace-nowrap">Быстрый тест:</span>
          <button
            type="button"
            onClick={() => handleQuickSite('sandbox')}
            className={`px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
              isUsingSandbox
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-semibold'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
          >
            ⭐ Интерактивный полигон
          </button>
          <button
            type="button"
            onClick={() => handleQuickSite('https://example.com')}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            example.com
          </button>
          <button
            type="button"
            onClick={() => handleQuickSite('https://news.ycombinator.com')}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Hacker News
          </button>
          <button
            type="button"
            onClick={() => handleQuickSite('https://wikipedia.org')}
            className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Wikipedia
          </button>
        </div>

        {/* Network status badges */}
        <div className="flex items-center gap-2">
          {isPageBusy ? (
            <span className="inline-flex items-center gap-1 text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Сеть активна ({activeRequests} зап.)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Страница готова
            </span>
          )}

          {!isUsingSandbox && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
              title="Открыть сайт напрямую в новой вкладке"
            >
              <span>Прямая ссылка</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Inspector Mode Banner Indicator */}
      {isInspectorMode && (
        <div 
          id="inspector-mode-alert"
          className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-amber-300 font-medium animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-amber-400 animate-spin" />
            <span>
              <strong>Режим выбора цели включен:</strong> Наведите курсор на нужную кнопку или ссылку и нажмите ее. Селектор добавится в очередь автокликера.
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleInspector}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      )}

      {/* Viewport Canvas Container */}
      <div 
        id="browser-viewport-canvas"
        className="flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-2 relative"
      >
        <div
          className={`h-full transition-all duration-300 flex flex-col ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[420px] rounded-[32px] border-[6px] border-slate-800 shadow-2xl overflow-hidden bg-slate-900 relative'
              : 'w-full rounded-xl border border-slate-800/80 bg-slate-900'
          }`}
        >
          {/* Mobile device notch indicator */}
          {deviceMode === 'mobile' && (
            <div className="w-full bg-slate-800 h-5 flex items-center justify-center shrink-0">
              <div className="w-20 h-3 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              </div>
            </div>
          )}

          {/* Web Content Body: Sandbox OR Proxied Iframe */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-900">
            {isUsingSandbox ? (
              <InteractiveSandbox
                isInspectorMode={isInspectorMode}
                onTargetClick={(target) => {
                  onTargetPicked({
                    selector: target.selector,
                    tag: target.tag,
                    text: target.text,
                    id: target.id,
                    x: 0,
                    y: 0,
                  });
                }}
              />
            ) : (
              <iframe
                ref={iframeRef}
                id="proxied-target-iframe"
                src={proxySrc}
                title="Target Website Viewer"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => {
                  setIsIframeLoading(false);
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({
                      type: 'SET_INSPECTOR_MODE',
                      active: isInspectorMode,
                    }, '*');
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
