import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Trash2, 
  Copy, 
  Play, 
  Search, 
  FileText, 
  Check, 
  Sparkles,
  MousePointer,
  Clock,
  Repeat
} from 'lucide-react';
import { MacroConfig } from '../types';

interface MacroManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMacros: MacroConfig[];
  currentMacro: MacroConfig;
  onSaveCurrentMacro: (name: string, description: string) => void;
  onLoadMacro: (macro: MacroConfig) => void;
  onDeleteMacro: (id: string) => void;
  onImportMacros: (macros: MacroConfig[]) => void;
}

export const MacroManagerModal: React.FC<MacroManagerModalProps> = ({
  isOpen,
  onClose,
  savedMacros,
  currentMacro,
  onSaveCurrentMacro,
  onLoadMacro,
  onDeleteMacro,
  onImportMacros,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'save'>('list');
  const [macroName, setMacroName] = useState(currentMacro.name || 'Новый макрос');
  const [macroDesc, setMacroDesc] = useState(currentMacro.description || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!macroName.trim()) return;
    onSaveCurrentMacro(macroName.trim(), macroDesc.trim());
    setFeedbackMsg('Макрос успешно сохранен!');
    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveTab('list');
    }, 1200);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedMacros, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `autoclicker_macros_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        if (list.length > 0 && list[0].steps) {
          onImportMacros(list);
          setFeedbackMsg(`Импортировано ${list.length} макросов!`);
          setTimeout(() => setFeedbackMsg(null), 2000);
        } else {
          alert('Файл имеет неверный формат макроса');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON файла');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredMacros = savedMacros.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      id="macro-manager-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="macro-manager-modal-window"
        className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100">
              Менеджер макросов автокликера
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Сохраненные ({savedMacros.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('save')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'save'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить текущий</span>
            </button>
          </div>

          {/* Import / Export JSON buttons */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Импортировать макросы из файла JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Импорт JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Экспортировать все макросы в файл JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Экспорт JSON</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Поиск по названию или URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500"
                />
              </div>

              {filteredMacros.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Макросы не найдены. Создайте свой или импортируйте из файла.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredMacros.map((macro) => (
                    <div
                      key={macro.id}
                      className="bg-slate-800/60 hover:bg-slate-800/90 border border-slate-750 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100 truncate">
                            {macro.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-purple-400 border border-purple-500/20">
                            {macro.steps.length} {macro.steps.length === 1 ? 'цель' : 'целей'}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                            {macro.timingMode === 'adaptive' ? 'Адаптивный' : `${macro.fixedIntervalMs} мс`}
                          </span>
                        </div>

                        {macro.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {macro.description}
                          </p>
                        )}

                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 pt-0.5">
                          <span>URL: {macro.targetUrl || 'Встроенный полигон'}</span>
                          <span>• {new Date(macro.updatedAt || macro.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-750">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadMacro(macro);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Загрузить</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteMacro(macro.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Удалить макрос"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Save Current Macro Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 block font-medium">Текущие параметры для сохранения:</span>
                <div className="text-slate-200 font-mono text-[11px]">
                  Целей: <span className="text-purple-400">{currentMacro.steps.length}</span> • 
                  Режим: <span className="text-blue-400">{currentMacro.timingMode}</span> • 
                  Сайт: <span className="text-emerald-400">{currentMacro.targetUrl || 'Полигон'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Название макроса:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Сбор наград каждый час"
                  value={macroName}
                  onChange={(e) => setMacroName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Описание или заметка (опционально):
                </label>
                <textarea
                  rows={3}
                  placeholder="Опишите логику выполнения или назначение шагов..."
                  value={macroDesc}
                  onChange={(e) => setMacroDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить в библиотеку</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
