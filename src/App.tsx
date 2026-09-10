import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BrowserView } from './components/BrowserView';
import { TargetSequencePanel } from './components/TargetSequencePanel';
import { ControlsBar } from './components/ControlsBar';
import { StatsAndLogsPanel } from './components/StatsAndLogsPanel';
import { MacroManagerModal } from './components/MacroManagerModal';
import { ApkBuildModal } from './components/ApkBuildModal';
import { DEFAULT_MACROS } from './defaultMacros';
import { 
  MacroConfig, 
  MacroStep, 
  ExecutionStats, 
  ExecutionStatus, 
  LogEntry, 
  PickedTargetEvent 
} from './types';

const STORAGE_SAVED_MACROS_KEY = 'autoclicker_saved_macros_v2';
const STORAGE_CURRENT_MACRO_KEY = 'autoclicker_current_macro_v2';

export default function App() {
  // Load saved macros from localStorage or defaults
  const [savedMacros, setSavedMacros] = useState<MacroConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_MACROS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MACROS;
  });

  // Current active macro configuration
  const [currentMacro, setCurrentMacro] = useState<MacroConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_MACRO_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.steps) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MACROS[0];
  });

  // Modals state
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Inspector element picker state
  const [isInspectorMode, setIsInspectorMode] = useState(false);

  // Execution engine state
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [currentLoop, setCurrentLoop] = useState(1);
  const [totalClicks, setTotalClicks] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [networkPingMs, setNetworkPingMs] = useState(38);
  const [isPageBusy, setIsPageBusy] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);
  const [pageReadyState, setPageReadyState] = useState('complete');

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Refs for execution loops and iframe communication
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const executionAbortedRef = useRef(false);
  const isPausedRef = useRef(false);
  const stepPromiseResolverRef = useRef<((val: boolean) => void) | null>(null);

  // Persist current macro on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_MACRO_KEY, JSON.stringify(currentMacro));
    } catch (e) {}
  }, [currentMacro]);

  // Persist saved macros list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_MACROS_KEY, JSON.stringify(savedMacros));
    } catch (e) {}
  }, [savedMacros]);

  // Add a log entry
  const addLog = useCallback((type: 'info' | 'success' | 'warning' | 'error', message: string, stepId?: string) => {
    const entry: LogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      type,
      message,
      stepId,
    };
    setLogs((prev) => [...prev.slice(-150), entry]);
  }, []);

  // Ping server periodically to measure real internet latency
  useEffect(() => {
    const pingInterval = setInterval(async () => {
      const clientT = Date.now();
      try {
        const res = await fetch(`/api/ping?t=${clientT}`);
        if (res.ok) {
          const data = await res.json();
          const rtt = Math.max(10, Date.now() - clientT);
          setNetworkPingMs(rtt);
        }
      } catch (err) {
        // Simulated fallback ping variation
        setNetworkPingMs(prev => Math.max(15, Math.min(240, prev + Math.floor(Math.random() * 20 - 10))));
      }
    }, 4000);

    return () => clearInterval(pingInterval);
  }, []);

  // Timer for elapsed seconds and clicks/min calculation
  useEffect(() => {
    let timer: any = null;
    if (status === 'running') {
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Calculate clicks per minute
  const clicksPerMinute = elapsedSeconds > 0 
    ? Math.round((totalClicks / elapsedSeconds) * 60) 
    : 0;

  // Handle postMessage events from the proxied target website iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'TARGET_PICKED') {
        const target: PickedTargetEvent = data.target;
        handleTargetPicked(target);
      } else if (data.type === 'PAGE_STATUS') {
        setIsPageBusy(!!data.isBusy);
        setActiveRequests(data.pendingRequests || 0);
        if (data.readyState) setPageReadyState(data.readyState);
      } else if (data.type === 'STEP_RESULT') {
        if (stepPromiseResolverRef.current) {
          stepPromiseResolverRef.current(data.success);
          stepPromiseResolverRef.current = null;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentMacro]);

  // Handle Target Picked by Visual Inspector (from iframe or sandbox)
  const handleTargetPicked = useCallback((target: PickedTargetEvent) => {
    const label = target.text 
      ? `Клик "${target.text.slice(0, 24)}"` 
      : target.tag === 'input' 
      ? 'Поле ввода' 
      : `Элемент <${target.tag}>`;

    const newStep: MacroStep = {
      id: 'step-' + Date.now(),
      label,
      action: target.tag === 'input' && !['button', 'submit', 'checkbox', 'radio'].includes(target.name || '') ? 'type' : 'click',
      selector: target.selector,
      textValue: target.tag === 'input' ? 'Пример' : '',
      customDelayMs: 500,
      enabled: true,
      timeoutMs: 5000,
      x: target.x,
      y: target.y,
    };

    setCurrentMacro(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));

    addLog('success', `🎯 Добавлена новая цель: ${newStep.label} (${target.selector})`);
    setIsInspectorMode(false);
  }, [addLog]);

  // Execute a single step in sandbox or iframe
  const executeStep = async (step: MacroStep): Promise<boolean> => {
    if (step.action === 'delay') {
      const delay = step.customDelayMs || 1000;
      addLog('info', `⏳ Пауза ${delay} мс...`, step.id);
      await new Promise(r => setTimeout(r, delay));
      return true;
    }

    const isSandbox = !currentMacro.targetUrl || currentMacro.targetUrl === 'sandbox';

    if (isSandbox) {
      // Execute directly on DOM inside sandbox container
      const container = document.getElementById('interactive-sandbox-container');
      const el = container?.querySelector(step.selector) as HTMLElement | null;

      if (!el && step.action !== 'wait_element') {
        addLog('warning', `⚠️ Элемент не найден: ${step.selector}`, step.id);
        return false;
      }

      if (step.action === 'type') {
        if (el && 'value' in el) {
          (el as HTMLInputElement).value = step.textValue || '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          addLog('success', `⌨ Введен текст "${step.textValue}" в ${step.label}`, step.id);
        }
        return true;
      }

      if (step.action === 'wait_element') {
        if (el) {
          addLog('success', `👁 Элемент обнаружен: ${step.label}`, step.id);
          return true;
        }
        return false;
      }

      // Default: click or double click
      if (el) {
        // Visual outline flash
        const prevOutline = el.style.outline;
        el.style.outline = '3px solid #ef4444';
        setTimeout(() => {
          if (el) el.style.outline = prevOutline;
        }, 300);

        el.click();
        setTotalClicks(c => c + 1);
        addLog('success', `👆 Клик по «${step.label}» (${step.selector})`, step.id);
        return true;
      }

      return false;
    } else {
      // Execute in proxied iframe via postMessage
      if (!iframeRef.current || !iframeRef.current.contentWindow) {
        addLog('error', 'Вкладка сайта не инициализирована', step.id);
        return false;
      }

      return new Promise<boolean>((resolve) => {
        stepPromiseResolverRef.current = (success) => {
          if (success) {
            setTotalClicks(c => c + 1);
            addLog('success', `👆 Клик выполнен: ${step.label}`, step.id);
          } else {
            addLog('warning', `⚠️ Ошибка выполнения шага: ${step.label}`, step.id);
          }
          resolve(success);
        };

        try {
          iframeRef.current.contentWindow?.postMessage({
            type: 'EXECUTE_STEP',
            step
          }, '*');
        } catch (e) {
          resolve(false);
        }

        // Safety timeout in case iframe doesn't respond
        setTimeout(() => {
          if (stepPromiseResolverRef.current) {
            stepPromiseResolverRef.current(true);
          }
        }, 3500);
      });
    }
  };

  // Calculate dynamic delay between steps
  const computeStepDelay = (step: MacroStep): number => {
    let delay = step.customDelayMs ?? 500;

    if (currentMacro.timingMode === 'adaptive') {
      // Adaptive mode calculates dynamic latency
      const baseDelay = currentMacro.adaptiveSettings.minDelayMs;
      const speedMult = currentMacro.adaptiveSettings.speedMultiplier || 1.0;
      // Slower ping => longer wait to allow network response
      const adaptiveNetworkDelay = Math.round(networkPingMs * 1.5 * (1 / speedMult));
      delay = Math.max(baseDelay, adaptiveNetworkDelay);
    } else {
      // Fixed interval mode
      delay = currentMacro.fixedIntervalMs;
    }

    // Optional human random jitter
    if (currentMacro.randomJitterMs > 0) {
      const jitter = Math.floor((Math.random() * 2 - 1) * currentMacro.randomJitterMs);
      delay = Math.max(50, delay + jitter);
    }

    return delay;
  };

  // Run the macro sequence loop
  const startMacro = async () => {
    if (currentMacro.steps.length === 0) {
      addLog('warning', 'Очередь целей пуста. Добавьте кнопки или ссылки для клика.');
      return;
    }

    executionAbortedRef.current = false;
    isPausedRef.current = false;
    setStatus('running');
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setTotalClicks(0);
    setCurrentLoop(1);

    addLog('info', `🚀 Запуск макроса «${currentMacro.name}». Режим: ${currentMacro.timingMode === 'adaptive' ? 'Адаптивный (под скорость сети)' : 'Фиксированный интервал'}`);

    const maxLoops = currentMacro.loopCount; // 0 = infinite
    let loop = 1;

    while (!executionAbortedRef.current) {
      setCurrentLoop(loop);
      addLog('info', `🔄 Начат цикл ${loop}${maxLoops > 0 ? ` из ${maxLoops}` : ' (бесконечный)'}`);

      for (let i = 0; i < currentMacro.steps.length; i++) {
        if (executionAbortedRef.current) break;

        // Pause handler
        while (isPausedRef.current && !executionAbortedRef.current) {
          await new Promise(r => setTimeout(r, 150));
        }

        const step = currentMacro.steps[i];
        if (!step.enabled) continue;

        setActiveStepIndex(i);

        // Adaptive network idle check: if page is loading or fetching, wait before action
        if (currentMacro.timingMode === 'adaptive' && currentMacro.adaptiveSettings.waitForNetworkIdle) {
          let waitAttempts = 0;
          while (isPageBusy && waitAttempts < 15 && !executionAbortedRef.current) {
            await new Promise(r => setTimeout(r, 100));
            waitAttempts++;
          }
        }

        // Execute step
        await executeStep(step);

        // Wait calculated delay before next action
        const delay = computeStepDelay(step);
        await new Promise(r => setTimeout(r, delay));
      }

      if (executionAbortedRef.current) break;

      // Check if finished loops
      if (maxLoops > 0 && loop >= maxLoops) {
        addLog('success', `🎉 Макрос успешно завершил все ${maxLoops} циклов!`);
        setStatus('completed');
        setActiveStepIndex(null);
        return;
      }

      loop++;
    }

    setActiveStepIndex(null);
    if (status !== 'completed') {
      setStatus('stopped');
      addLog('info', '⏹ Автокликер остановлен пользователем.');
    }
  };

  const pauseMacro = () => {
    isPausedRef.current = true;
    setStatus('paused');
    addLog('warning', '⏸ Выполнение макроса приостановлено');
  };

  const resumeMacro = () => {
    isPausedRef.current = false;
    setStatus('running');
    addLog('info', '▶ Выполнение макроса возобновлено');
  };

  const stopMacro = () => {
    executionAbortedRef.current = true;
    isPausedRef.current = false;
    setStatus('stopped');
    setActiveStepIndex(null);
  };

  const stepNext = async () => {
    if (currentMacro.steps.length === 0) return;
    const nextIdx = activeStepIndex === null ? 0 : (activeStepIndex + 1) % currentMacro.steps.length;
    setActiveStepIndex(nextIdx);
    const step = currentMacro.steps[nextIdx];
    await executeStep(step);
  };

  const testSingleStep = async (step: MacroStep) => {
    addLog('info', `🧪 Тест шага: ${step.label}...`);
    await executeStep(step);
  };

  // Macro Manager actions
  const handleSaveCurrentMacro = (name: string, description: string) => {
    const updated: MacroConfig = {
      ...currentMacro,
      name,
      description,
      updatedAt: Date.now(),
    };
    setCurrentMacro(updated);

    // Save to list
    setSavedMacros((prev) => {
      const idx = prev.findIndex(m => m.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      } else {
        return [updated, ...prev];
      }
    });

    addLog('success', `💾 Макрос «${name}» сохранен в библиотеку`);
  };

  const handleLoadMacro = (macro: MacroConfig) => {
    stopMacro();
    setCurrentMacro(macro);
    addLog('info', `📂 Загружен макрос «${macro.name}» (${macro.steps.length} целей)`);
  };

  const handleDeleteMacro = (id: string) => {
    setSavedMacros(prev => prev.filter(m => m.id !== id));
    addLog('info', '🗑 Макрос удален из библиотеки');
  };

  const handleImportMacros = (imported: MacroConfig[]) => {
    setSavedMacros(prev => [...imported, ...prev]);
    addLog('success', `📥 Импортировано ${imported.length} макросов`);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        status={status}
        savedMacrosCount={savedMacros.length}
        onOpenMacroManager={() => setIsMacroModalOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        networkPingMs={networkPingMs}
      />

      {/* Main Workspace Layout */}
      <main id="app-main-workspace" className="flex-1 p-3 md:p-4 max-w-[1700px] w-full mx-auto flex flex-col gap-3">
        {/* Top Controls Bar: Start/Pause/Stop, Timing Mode, Speed Multiplier */}
        <ControlsBar
          config={currentMacro}
          onUpdateConfig={(updates) => setCurrentMacro(prev => ({ ...prev, ...updates }))}
          status={status}
          onStart={startMacro}
          onPause={pauseMacro}
          onResume={resumeMacro}
          onStop={stopMacro}
          onStepNext={stepNext}
          networkPingMs={networkPingMs}
        />

        {/* Workspace Split: Browser Viewer (Left) & Macro Steps + Logs (Right) */}
        <div id="workspace-columns-grid" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[640px]">
          {/* Left / Center Column: Interactive Browser Viewer (Sandbox or Proxied Website) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-[500px]">
            <BrowserView
              url={currentMacro.targetUrl}
              onUrlChange={(newUrl) => setCurrentMacro(prev => ({ ...prev, targetUrl: newUrl }))}
              isInspectorMode={isInspectorMode}
              onToggleInspector={() => setIsInspectorMode(!isInspectorMode)}
              onTargetPicked={handleTargetPicked}
              iframeRef={iframeRef}
              isPageBusy={isPageBusy}
              activeRequests={activeRequests}
            />
          </div>

          {/* Right Column: Sequence Steps List & Real-time Logs Terminal */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 h-full">
            {/* Target Sequence Panel */}
            <div className="flex-1 min-h-[340px]">
              <TargetSequencePanel
                steps={currentMacro.steps}
                onUpdateSteps={(steps) => setCurrentMacro(prev => ({ ...prev, steps }))}
                activeStepIndex={activeStepIndex}
                isExecuting={status === 'running' || status === 'paused'}
                onTestStep={testSingleStep}
                onToggleInspector={() => setIsInspectorMode(!isInspectorMode)}
                isInspectorMode={isInspectorMode}
              />
            </div>

            {/* Live Stats & Logs Panel */}
            <div className="h-[250px] shrink-0">
              <StatsAndLogsPanel
                stats={{
                  status,
                  currentStepIndex: activeStepIndex ?? 0,
                  currentLoop,
                  totalLoops: currentMacro.loopCount,
                  totalClicks,
                  startTime,
                  elapsedSeconds,
                  clicksPerMinute,
                  networkPingMs,
                  isPageBusy,
                  pageReadyState,
                  activeRequests,
                }}
                logs={logs}
                onClearLogs={() => setLogs([])}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Macro Manager Modal (Save / Load / Export / Import) */}
      <MacroManagerModal
        isOpen={isMacroModalOpen}
        onClose={() => setIsMacroModalOpen(false)}
        savedMacros={savedMacros}
        currentMacro={currentMacro}
        onSaveCurrentMacro={handleSaveCurrentMacro}
        onLoadMacro={handleLoadMacro}
        onDeleteMacro={handleDeleteMacro}
        onImportMacros={handleImportMacros}
      />

      {/* GitHub APK Build Modal */}
      <ApkBuildModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
}
