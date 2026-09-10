import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Check, 
  Copy, 
  Terminal, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  Cpu,
  PackageCheck
} from 'lucide-react';

interface ApkBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkBuildModal: React.FC<ApkBuildModalProps> = ({ isOpen, onClose }) => {
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedCapacitor, setCopiedCapacitor] = useState(false);

  if (!isOpen) return null;

  const workflowCode = `name: Build Android APK
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install && npm run build
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: android-actions/setup-android@v3
      - run: |
          npx cap add android || true
          npx cap sync android
          cd android && chmod +x gradlew && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: web-autoclicker-debug-apk
          path: android/app/build/outputs/apk/debug/*.apk`;

  const capacitorConfig = `{
  "appId": "com.autoclicker.macrorunner",
  "appName": "Web Auto Clicker",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "cleartext": true,
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWorkflowFile = () => {
    const blob = new Blob([workflowCode], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-apk.yml';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div 
      id="apk-build-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        id="apk-build-modal-window"
        className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Сборка APK для Android через GitHub Actions
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Всё готово
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Автоматическая компиляция Android APK в облаке GitHub с возможностью установки на телефон
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Step-by-Step Visual Guide */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-blue-400" />
              Пошаговая инструкция получения APK файла
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              {/* Step 1 */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs mb-2">
                    1
                  </div>
                  <div className="font-semibold text-slate-200 mb-1">Экспорт на GitHub</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Нажмите меню Settings (шестеренка вверху) → «Export to GitHub» или сделайте <code className="text-slate-300">git push</code> в свой репозиторий.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 font-mono font-bold flex items-center justify-center text-xs mb-2">
                    2
                  </div>
                  <div className="font-semibold text-slate-200 mb-1">Файл Workflow уже на месте</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Файл <code className="text-purple-300 font-mono">.github/workflows/build-apk.yml</code> уже включен в проект.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-lg bg-amber-600/20 text-amber-400 font-mono font-bold flex items-center justify-center text-xs mb-2">
                    3
                  </div>
                  <div className="font-semibold text-slate-200 mb-1">Автосборка в Actions</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Откройте вкладку <strong>Actions</strong> на GitHub. Сборка запустится автоматически за 1-2 минуты.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between border-emerald-500/30 bg-emerald-500/5">
                <div>
                  <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs mb-2">
                    4
                  </div>
                  <div className="font-semibold text-emerald-300 mb-1">Скачивание APK</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    В разделе <strong>Artifacts</strong> скачайте <code className="text-emerald-400 font-mono">web-autoclicker-debug.apk</code> прямо на телефон!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Action Workflow Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-slate-200">
                  Конфигурация .github/workflows/build-apk.yml
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadWorkflowFile}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать .yml</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(workflowCode, setCopiedWorkflow)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors cursor-pointer text-[11px] font-semibold"
                >
                  {copiedWorkflow ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWorkflow ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto">
              <pre>{workflowCode}</pre>
            </div>
          </div>

          {/* Android Permissions & Capacities included */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2 text-[11px]">
            <span className="font-semibold text-slate-300 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Поддерживаемые Android возможности в сборке:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Разрешение <strong>android.permission.INTERNET</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Авто-подстройка под 3G/4G/Wi-Fi скорость</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Поддержка смешанного контента (HTTP/HTTPS)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Офлайн сохранение макросов на телефоне</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Готовый APK будет подписан debug-сертификатом и сразу готов к установке
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
