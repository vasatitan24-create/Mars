import React, { useState } from 'react';
import { 
  Crosshair, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  MousePointer, 
  Type, 
  Clock, 
  CheckCircle, 
  Eye, 
  ScrollText, 
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { MacroStep, ActionType } from '../types';

interface TargetSequencePanelProps {
  steps: MacroStep[];
  onUpdateSteps: (steps: MacroStep[]) => void;
  activeStepIndex: number | null;
  isExecuting: boolean;
  onTestStep: (step: MacroStep) => void;
  onToggleInspector: () => void;
  isInspectorMode: boolean;
}

export const TargetSequencePanel: React.FC<TargetSequencePanelProps> = ({
  steps,
  onUpdateSteps,
  activeStepIndex,
  isExecuting,
  onTestStep,
  onToggleInspector,
  isInspectorMode,
}) => {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const addStep = (action: ActionType) => {
    const newStep: MacroStep = {
      id: 'step-' + Date.now(),
      label: action === 'click' ? 'Клик по цели' 
           : action === 'type' ? 'Ввод текста' 
           : action === 'wait_element' ? 'Ожидание элемента' 
           : action === 'delay' ? 'Пауза' 
           : 'Скролл',
      action,
      selector: action === 'delay' ? '' : 'button',
      textValue: action === 'type' ? 'Текст' : '',
      customDelayMs: action === 'delay' ? 1000 : 500,
      enabled: true,
      timeoutMs: 5000,
    };
    onUpdateSteps([...steps, newStep]);
    setEditingStepId(newStep.id);
  };

  const updateStep = (id: string, updates: Partial<MacroStep>) => {
    onUpdateSteps(
      steps.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteStep = (id: string) => {
    onUpdateSteps(steps.filter((s) => s.id !== id));
    if (editingStepId === id) setEditingStepId(null);
  };

  const duplicateStep = (step: MacroStep) => {
    const copy: MacroStep = {
      ...step,
      id: 'step-' + Date.now(),
      label: `${step.label} (копия)`,
    };
    onUpdateSteps([...steps, copy]);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const newSteps = [...steps];
    const [moved] = newSteps.splice(index, 1);
    newSteps.splice(targetIndex, 0, moved);
    onUpdateSteps(newSteps);
  };

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'click':
        return <MousePointer className="w-3.5 h-3.5 text-blue-400" />;
      case 'double_click':
        return <MousePointer className="w-3.5 h-3.5 text-indigo-400" />;
      case 'type':
        return <Type className="w-3.5 h-3.5 text-purple-400" />;
      case 'wait_element':
        return <Eye className="w-3.5 h-3.5 text-amber-400" />;
      case 'delay':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'scroll':
        return <ScrollText className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div 
      id="target-sequence-panel"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Panel Header */}
      <div 
        id="sequence-panel-header"
        className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100">
            Очередь целей автокликера
          </h2>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-mono font-medium border border-slate-700">
            {steps.length} {steps.length === 1 ? 'шаг' : steps.length < 5 ? 'шага' : 'шагов'}
          </span>
        </div>

        {/* Visual Picker Button */}
        <button
          id="target-panel-inspector-btn"
          type="button"
          onClick={onToggleInspector}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isInspectorMode
              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/30'
          }`}
          title="Нажмите, чтобы кликать по элементам сайта и автоматически добавлять их в очередь"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>{isInspectorMode ? 'Выбор активен...' : 'Прицел'}</span>
        </button>
      </div>

      {/* Add Step Action Bar */}
      <div 
        id="add-step-action-bar"
        className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs"
      >
        <span className="text-slate-400 text-[11px] font-medium mr-1">Добавить действие:</span>
        <button
          id="add-click-action-btn"
          type="button"
          onClick={() => addStep('click')}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-blue-300 rounded-lg border border-blue-500/20 transition-colors cursor-pointer"
        >
          <MousePointer className="w-3 h-3" />
          <span>Клик</span>
        </button>
        <button
          id="add-type-action-btn"
          type="button"
          onClick={() => addStep('type')}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-purple-300 rounded-lg border border-purple-500/20 transition-colors cursor-pointer"
        >
          <Type className="w-3 h-3" />
          <span>Текст</span>
        </button>
        <button
          id="add-wait-action-btn"
          type="button"
          onClick={() => addStep('wait_element')}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>Ожидание</span>
        </button>
        <button
          id="add-delay-action-btn"
          type="button"
          onClick={() => addStep('delay')}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-300 rounded-lg border border-emerald-500/20 transition-colors cursor-pointer"
        >
          <Clock className="w-3 h-3" />
          <span>Пауза</span>
        </button>
      </div>

      {/* Steps List */}
      <div 
        id="steps-list-scrollable"
        className="flex-1 overflow-y-auto p-3 space-y-2.5"
      >
        {steps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Crosshair className="w-10 h-10 text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-300 mb-1">Очередь целей пуста</h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Нажмите кнопку <strong>«Выбрать цель»</strong> на странице сайта или добавьте действие вручную кнопками сверху.
            </p>
            <button
              type="button"
              onClick={onToggleInspector}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              Включить прицел целей
            </button>
          </div>
        ) : (
          steps.map((step, idx) => {
            const isActive = activeStepIndex === idx && isExecuting;
            const isEditing = editingStepId === step.id;

            return (
              <div
                key={step.id}
                id={`macro-step-card-${step.id}`}
                className={`rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/40 shadow-lg'
                    : step.enabled
                    ? 'bg-slate-800/70 border-slate-750 hover:border-slate-650'
                    : 'bg-slate-900/40 border-slate-850 opacity-60'
                }`}
              >
                {/* Step Item Row Header */}
                <div className="p-2.5 flex items-center justify-between gap-2">
                  {/* Left: Step Number, Enabled checkbox, Action Icon */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={(e) => updateStep(step.id, { enabled: e.target.checked })}
                      className="rounded border-slate-700 text-blue-600 cursor-pointer"
                      title="Включить / пропустить этот шаг"
                    />

                    <span 
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-750 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="p-1 rounded bg-slate-900 border border-slate-750 shrink-0">
                        {getActionIcon(step.action)}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                          <span>{step.label}</span>
                          {isActive && (
                            <span className="text-[10px] text-blue-400 bg-blue-900/50 px-1.5 py-0.2 rounded font-mono animate-pulse">
                              КЛИК...
                            </span>
                          )}
                        </div>
                        {step.action !== 'delay' && (
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            {step.selector || 'Селектор не задан'}
                          </div>
                        )}
                        {step.action === 'delay' && (
                          <div className="text-[11px] font-mono text-emerald-400">
                            Пауза {step.customDelayMs || 1000} мс
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Test step, Move up/down, Duplicate, Edit, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTestStep(step)}
                      disabled={isExecuting}
                      className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                      title="Выполнить только этот шаг сейчас"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                      title="Переместить выше"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === steps.length - 1}
                      className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                      title="Переместить ниже"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateStep(step)}
                      className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Дублировать шаг"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingStepId(isEditing ? null : step.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isEditing ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Настроить шаг"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteStep(step.id)}
                      className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Удалить шаг"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Step Editor */}
                {isEditing && (
                  <div className="p-3 bg-slate-950/70 border-t border-slate-750/70 rounded-b-xl space-y-2.5 text-xs animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Название шага:
                        </label>
                        <input
                          type="text"
                          value={step.label}
                          onChange={(e) => updateStep(step.id, { label: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Тип действия:
                        </label>
                        <select
                          value={step.action}
                          onChange={(e) => updateStep(step.id, { action: e.target.value as ActionType })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="click">Одиночный клик (Click)</option>
                          <option value="double_click">Двойной клик (Double Click)</option>
                          <option value="type">Ввод текста (Type Text)</option>
                          <option value="wait_element">Ожидание элемента (Wait for element)</option>
                          <option value="delay">Пауза / Задержка (Delay)</option>
                          <option value="scroll">Прокрутка к элементу (Scroll)</option>
                        </select>
                      </div>
                    </div>

                    {step.action !== 'delay' && (
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          CSS Селектор или Текст цели:
                        </label>
                        <input
                          type="text"
                          value={step.selector}
                          onChange={(e) => updateStep(step.id, { selector: e.target.value })}
                          placeholder="Пример: #tap-coin-btn или button:contains('Купить')"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {step.action === 'type' && (
                      <div>
                        <label className="text-[11px] text-purple-400 font-medium block mb-1">
                          Текст для ввода:
                        </label>
                        <input
                          type="text"
                          value={step.textValue || ''}
                          onChange={(e) => updateStep(step.id, { textValue: e.target.value })}
                          placeholder="Введите значение..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Индивидуальная задержка (мс):
                        </label>
                        <input
                          type="number"
                          step={50}
                          min={0}
                          value={step.customDelayMs ?? 500}
                          onChange={(e) => updateStep(step.id, { customDelayMs: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                          Таймаут поиска (мс):
                        </label>
                        <input
                          type="number"
                          step={500}
                          min={500}
                          value={step.timeoutMs ?? 5000}
                          onChange={(e) => updateStep(step.id, { timeoutMs: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-[11px] outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
