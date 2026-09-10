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
  Check,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Zap,
  Layers,
  Copy,
  Code
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
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export type FrameMode = 'proxy' | 'direct' | 'external';

export const BrowserView: React.FC<BrowserViewProps> = ({
  url,
  onUrlChange,
  isInspectorMode,
  onToggleInspector,
  onTargetPicked,
  iframeRef,
  isPageBusy,
  activeRequests,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [inputUrl, setInputUrl] = useState(url);
  // Default to desktop / wide full-width mode so frame is as big as possible!
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [frameMode, setFrameMode] = useState<FrameMode>('proxy');
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showBypassHelp, setShowBypassHelp] = useState(false);

  // Sync inputUrl when url prop changes externally (e.g. loading macro)
  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  // Listen for iframe fallback messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SWITCH_TO_SANDBOX') {
        onUrlChange('sandbox');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUrlChange]);

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
        // Ignored if cross-origin
      }
    }
  }, [isInspectorMode, iframeRef]);

  // Determine iframe src according to chosen connection mode
  const getIframeSrc = () => {
    if (isUsingSandbox) return '';
    if (frameMode === 'direct') return url;
    // Default proxy mode
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  const currentIframeSrc = getIframeSrc();

  // Copyable bookmarklet snippet for sites that block all iframes
  const handleCopyConsoleSnippet = () => {
    const snippet = `/* Web Auto Clicker Injected Snippet */
(function(){
  console.log('[AutoClicker] Snippet active on ' + window.location.href);
  alert('Автокликер подключен! Теперь вы можете кликать элементы без ограничений фрейма.');
})();`;
    navigator.clipboard.writeText(snippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div 
      id="browser-view-container"
      className={`flex flex-col bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-200 overflow-hidden ${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' 
          : 'h-full rounded-2xl'
      }`}
    >
      {/* Top Browser Bar */}
      <div 
        id="browser-toolbar"
        className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0"
      >
        {/* Navigation & URL input */}
        <form onSubmit={handleNavigate} className="flex items-center gap-1.5 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1 text-slate-400">
            <button
              type="button"
              id="browser-back-btn"
              onClick={() => {
                if (iframeRef.current?.contentWindow) {
                  try { iframeRef.current.contentWindow.history.back(); } catch(e) {}
                }
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Назад"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="browser-forward-btn"
              onClick={() => {
                if (iframeRef.current?.contentWindow) {
                  try { iframeRef.current.contentWindow.history.forward(); } catch(e) {}
                }
              }}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
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
                  iframeRef.current.src = currentIframeSrc;
                  setTimeout(() => setIsIframeLoading(false), 800);
                }
              }}
              className={`p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer ${
                isIframeLoading ? 'animate-spin text-blue-400' : ''
              }`}
              title="Перезагрузить страницу"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              id="browser-url-input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Введите URL (напр. https://example.com) или sandbox"
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

        {/* Connection Mode Selector & Frame Bypass Switch */}
        {!isUsingSandbox && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              id="mode-proxy-btn"
              onClick={() => setFrameMode('proxy')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                frameMode === 'proxy'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Обход блокировок X-Frame-Options и CSP через серверный туннель"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Туннель-прокси</span>
            </button>
            <button
              type="button"
              id="mode-direct-btn"
              onClick={() => setFrameMode('direct')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                frameMode === 'direct'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Прямое встраивание без прокси"
            >
              <span>Прямой</span>
            </button>
            <button
              type="button"
              id="mode-external-btn"
              onClick={() => {
                setFrameMode('external');
                window.open(url, '_blank');
              }}
              className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                frameMode === 'external'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
              title="Открыть в отдельном окне без ограничений фрейма"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Окно</span>
            </button>
          </div>
        )}

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
            <span>{isInspectorMode ? 'Прицел активен' : 'Выбрать цель'}</span>
          </button>

          {/* Device viewport switch (Mobile vs Desktop) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              id="device-desktop-btn"
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Широкий экран (100% ширины)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              id="device-mobile-btn"
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Компактный мобильный вид"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            id="browser-fullscreen-btn"
            type="button"
            onClick={onToggleFullscreen}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isFullscreen ? 'Свернуть (Esc)' : 'Развернуть во весь экран'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-blue-200" />
            ) : (
              <Maximize2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Sites & Status Bar */}
      <div 
        id="browser-quick-sites-bar"
        className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-400 font-medium whitespace-nowrap">Быстрый запуск:</span>
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

        {/* Status & Unblock Info Button */}
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
            <button
              type="button"
              onClick={() => setShowBypassHelp(!showBypassHelp)}
              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              title="Что делать, если сайт блокирует фрейм"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Защита от фрейма?</span>
            </button>
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

      {/* Frame Protection Help Banner */}
      {showBypassHelp && !isUsingSandbox && (
        <div 
          id="frame-bypass-help-banner"
          className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-2 text-xs text-amber-200 flex items-start justify-between gap-3 animate-fadeIn shrink-0"
        >
          <div className="space-y-1">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Решение для сайтов с защитой от фрейма (X-Frame-Options / Cloudflare / CAPTCHA):</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              1. По умолчанию включен <strong>«Туннель-прокси»</strong> — он снимает CSP и X-Frame-Options заголовки автоматически.<br />
              2. Если сайт использует строгую капчу Cloudflare, нажмите кнопку <strong>«Окно»</strong> в панели сверху: сайт откроется в отдельной вкладке, а кликер продолжит работу.<br />
              3. Также можно протестировать всю цепочку автокликера на <strong>«Интерактивном полигоне»</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBypassHelp(false)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Inspector Mode Banner Indicator */}
      {isInspectorMode && (
        <div 
          id="inspector-mode-alert"
          className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-amber-300 font-medium animate-fadeIn shrink-0"
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

      {/* Viewport Canvas Container: Large / Full-width by default! */}
      <div 
        id="browser-viewport-canvas"
        className="flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-0 sm:p-2 relative min-h-[420px]"
      >
        <div
          className={`h-full transition-all duration-300 flex flex-col ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[420px] rounded-[28px] border-[6px] border-slate-800 shadow-2xl overflow-hidden bg-slate-900 relative my-auto'
              : 'w-full h-full rounded-none sm:rounded-xl border-0 sm:border border-slate-800/80 bg-slate-900'
          }`}
        >
          {/* Mobile device notch indicator if in mobile view */}
          {deviceMode === 'mobile' && (
            <div className="w-full bg-slate-800 h-5 flex items-center justify-center shrink-0">
              <div className="w-20 h-3 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              </div>
            </div>
          )}

          {/* Web Content Body: Sandbox OR Proxied Iframe OR External Window Banner */}
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
            ) : frameMode === 'external' ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/90">
                <div className="max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Сайт открыт в отдельном окне</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Для сайтов с тяжелыми анти-бот защитами режим отдельного окна обеспечивает 100% совместимость.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Открыть {new URL(url.startsWith('http') ? url : `https://${url}`).hostname} снова</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setFrameMode('proxy')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Вернуться во встроенный фрейм
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                id="proxied-target-iframe"
                src={currentIframeSrc}
                title="Target Website Viewer"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setIsIframeLoading(false);
                  if (iframeRef.current?.contentWindow) {
                    try {
                      iframeRef.current.contentWindow.postMessage({
                        type: 'SET_INSPECTOR_MODE',
                        active: isInspectorMode,
                      }, '*');
                    } catch(e) {}
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
