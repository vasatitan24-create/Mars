import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  ShoppingCart, 
  Send, 
  Wifi, 
  RefreshCw, 
  Layers, 
  BarChart3, 
  Download,
  Flame
} from 'lucide-react';

interface InteractiveSandboxProps {
  onTargetClick?: (elementInfo: {
    selector: string;
    text: string;
    tag: string;
    id: string;
  }) => void;
  isInspectorMode?: boolean;
}

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  onTargetClick,
  isInspectorMode = false
}) => {
  // Coin tap faucet state
  const [coins, setCoins] = useState(128);
  const [bonusAvailable, setBonusAvailable] = useState(true);
  const [tapRipples, setTapRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Form state
  const [email, setEmail] = useState('');
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [shippingOption, setShippingOption] = useState<'standard' | 'fast'>('standard');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  // Tabs state
  const [activeTab, setActiveTab] = useState<'tap' | 'shop' | 'stats' | 'orders'>('tap');
  const [chartDataKey, setChartDataKey] = useState(0);

  // Simulated artificial network latency
  const [simulatedNetworkDelay, setSimulatedNetworkDelay] = useState(0);
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(false);

  const handleElementInspectClick = (e: React.MouseEvent<HTMLElement>, id: string, tag: string, text: string) => {
    if (isInspectorMode && onTargetClick) {
      e.preventDefault();
      e.stopPropagation();
      onTargetClick({
        selector: `#${id}`,
        text: text.slice(0, 40),
        tag,
        id
      });
    }
  };

  const handleCoinTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isInspectorMode) {
      handleElementInspectClick(e, 'tap-coin-btn', 'button', 'Тапнуть монету +1');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTapRipples(prev => [...prev.slice(-6), { id: Date.now() + Math.random(), x, y }]);

    if (simulatedNetworkDelay > 0) {
      setIsSimulatedLoading(true);
      setTimeout(() => {
        setCoins(c => c + 1);
        setIsSimulatedLoading(false);
      }, simulatedNetworkDelay);
    } else {
      setCoins(c => c + 1);
    }
  };

  const handleClaimBonus = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isInspectorMode) {
      handleElementInspectClick(e, 'claim-bonus-btn', 'button', 'Собрать бонус +25');
      return;
    }
    if (!bonusAvailable) return;
    setCoins(c => c + 25);
    setBonusAvailable(false);
    setTimeout(() => setBonusAvailable(true), 3000);
  };

  const handleApplyPromo = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isInspectorMode) {
      handleElementInspectClick(e, 'apply-promo-btn', 'button', 'Активировать промокод');
      return;
    }
    if (promo.trim().toUpperCase() === 'SPEED2026' || promo.trim().length > 0) {
      setPromoApplied(true);
    }
  };

  const handleSubmitOrder = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isInspectorMode) {
      handleElementInspectClick(e, 'submit-order-btn', 'button', 'Подтвердить заказ');
      return;
    }
    setOrderStatus('processing');
    const delay = simulatedNetworkDelay > 0 ? simulatedNetworkDelay : 800;
    setTimeout(() => {
      setOrderStatus('done');
      setTimeout(() => setOrderStatus('idle'), 4000);
    }, delay);
  };

  return (
    <div 
      id="interactive-sandbox-container"
      className="h-full w-full overflow-y-auto bg-slate-900 text-slate-100 p-4 select-text relative"
    >
      {/* Top Banner indicating Interactive Sandbox mode */}
      <div 
        id="sandbox-top-header"
        className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800 text-xs"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">Встроенный интерактивный полигон</span>
          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            Готов для автоклика
          </span>
        </div>

        {/* Network Lag Simulator control */}
        <div 
          id="network-lag-control"
          className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/80"
        >
          <Wifi className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">Симуляция задержки сети:</span>
          <select
            id="select-simulated-network-delay"
            value={simulatedNetworkDelay}
            onChange={(e) => setSimulatedNetworkDelay(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-blue-300 font-mono outline-none cursor-pointer"
          >
            <option value={0}>0 мс (Мгновенно)</option>
            <option value={350}>350 мс (Быстрый 4G)</option>
            <option value={900}>900 мс (Медленный 3G)</option>
            <option value={1800}>1800 мс (Тяжелый пинг)</option>
          </select>
          {isSimulatedLoading && (
            <span className="text-amber-400 font-mono text-[10px] animate-pulse">
              [Загрузка...]
            </span>
          )}
        </div>
      </div>

      {/* Navigation tabs within sandbox */}
      <div id="sandbox-navigation-tabs" className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
        <button
          id="tab-btn-tap"
          onClick={(e) => {
            if (isInspectorMode) handleElementInspectClick(e, 'tab-btn-tap', 'button', 'Тапалка монет');
            else setActiveTab('tap');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'tap'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          Тапалка монет
        </button>

        <button
          id="tab-btn-shop"
          onClick={(e) => {
            if (isInspectorMode) handleElementInspectClick(e, 'tab-btn-shop', 'button', 'Оформление заказа');
            else setActiveTab('shop');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'shop'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Оформление заказа
        </button>

        <button
          id="tab-btn-stats"
          onClick={(e) => {
            if (isInspectorMode) handleElementInspectClick(e, 'tab-btn-stats', 'button', 'Статистика');
            else setActiveTab('stats');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'stats'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Статистика
        </button>

        <button
          id="tab-btn-orders"
          onClick={(e) => {
            if (isInspectorMode) handleElementInspectClick(e, 'tab-btn-orders', 'button', 'Заказы');
            else setActiveTab('orders');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Заказы
        </button>
      </div>

      {/* Tab 1: Faucet / Coin Clicker (Great for high-frequency clicking and adaptive delay testing) */}
      {activeTab === 'tap' && (
        <div id="sandbox-tap-section" className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-medium mb-3">
              <Flame className="w-3.5 h-3.5" />
              Идеально для теста кликера и замера скорости
            </div>

            <h3 className="text-xl font-bold text-slate-100 mb-1">Баланс монет</h3>
            <div id="coin-counter-display" className="text-4xl font-extrabold text-amber-400 font-mono tracking-tight my-2">
              {coins.toLocaleString()} <span className="text-lg text-amber-300">PTS</span>
            </div>

            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Нажимайте кнопку вручную или запустите автокликер по селектору <code className="text-blue-400 font-mono bg-slate-900 px-1 py-0.5 rounded">#tap-coin-btn</code>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Main Tap Button */}
              <button
                id="tap-coin-btn"
                onClick={handleCoinTap}
                className="relative overflow-hidden w-full sm:w-auto min-w-[180px] px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-amber-500/25 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Coins className="w-5 h-5" />
                <span>Тапнуть монету +1</span>
                {tapRipples.map(r => (
                  <span
                    key={r.id}
                    style={{ left: r.x, top: r.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/40 pointer-events-none animate-ping"
                  />
                ))}
              </button>

              {/* Claim Booster Bonus Button */}
              <button
                id="claim-bonus-btn"
                onClick={handleClaimBonus}
                disabled={!bonusAvailable}
                className={`w-full sm:w-auto min-w-[160px] px-5 py-3.5 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  bonusAvailable
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200 hover:bg-purple-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{bonusAvailable ? 'Собрать бонус +25' : 'Кулдаун 3 сек...'}</span>
              </button>

              {/* Reset Counter Button */}
              <button
                id="reset-counter-btn"
                onClick={(e) => {
                  if (isInspectorMode) handleElementInspectClick(e, 'reset-counter-btn', 'button', 'Сброс счета');
                  else setCoins(0);
                }}
                className="px-3 py-3.5 rounded-xl font-medium text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750 transition-colors"
                title="Сбросить счетчик монет"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Form & Order Checkout (Multi-step sequence: Type -> Click -> Choose -> Submit) */}
      {activeTab === 'shop' && (
        <div id="sandbox-form-section" className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              Форма оформления заказа (Тест ввода и кликов)
            </h3>
            {orderStatus === 'done' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Заказ успешно оформлен!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* User Email */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium block">
                Email покупателя <code className="text-blue-400 font-mono">#input-user-email</code>:
              </label>
              <input
                id="input-user-email"
                type="email"
                placeholder="example@site.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onClick={(e) => isInspectorMode && handleElementInspectClick(e, 'input-user-email', 'input', 'Email покупателя')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Promo Code with Apply button */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium block">
                Промокод <code className="text-blue-400 font-mono">#input-promo-code</code>:
              </label>
              <div className="flex gap-2">
                <input
                  id="input-promo-code"
                  type="text"
                  placeholder="SPEED2026"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  onClick={(e) => isInspectorMode && handleElementInspectClick(e, 'input-promo-code', 'input', 'Промокод')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-blue-500 outline-none"
                />
                <button
                  id="apply-promo-btn"
                  onClick={handleApplyPromo}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    promoApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {promoApplied ? '✓ Применен' : 'Применить'}
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Options */}
          <div className="space-y-2 pt-2 border-t border-slate-750">
            <span className="text-slate-400 text-xs font-medium block">Способ доставки:</span>
            <div className="flex flex-wrap gap-4 text-xs">
              <label 
                id="shipping-standard-label"
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => isInspectorMode && handleElementInspectClick(e, 'shipping-standard-radio', 'input', 'Обычная доставка')}
              >
                <input
                  id="shipping-standard-radio"
                  type="radio"
                  name="shipping"
                  checked={shippingOption === 'standard'}
                  onChange={() => setShippingOption('standard')}
                  className="text-blue-500"
                />
                <span className="text-slate-300">Обычная доставка (1-3 дня)</span>
              </label>

              <label 
                id="shipping-fast-label"
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => isInspectorMode && handleElementInspectClick(e, 'shipping-fast-radio', 'input', 'Быстрая доставка')}
              >
                <input
                  id="shipping-fast-radio"
                  type="radio"
                  name="shipping"
                  checked={shippingOption === 'fast'}
                  onChange={() => setShippingOption('fast')}
                  className="text-blue-500"
                />
                <span className="text-slate-300 font-semibold text-blue-400">Экспресс-доставка (Сегодня)</span>
              </label>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              id="submit-order-btn"
              onClick={handleSubmitOrder}
              disabled={orderStatus === 'processing'}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {orderStatus === 'processing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Оформление заказа...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Подтвердить заказ</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Stats view with refresh button */}
      {activeTab === 'stats' && (
        <div id="sandbox-stats-section" className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Аналитика активности кликов
            </h3>
            <button
              id="refresh-chart-btn"
              onClick={(e) => {
                if (isInspectorMode) handleElementInspectClick(e, 'refresh-chart-btn', 'button', 'Обновить график');
                else setChartDataKey(k => k + 1);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Обновить график
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Всего кликов</span>
              <span className="text-lg font-bold text-slate-100 font-mono">{coins}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Обновлений</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{chartDataKey}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Статус API</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">200 OK</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Orders list with download action */}
      {activeTab === 'orders' && (
        <div id="sandbox-orders-section" className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Журнал заказов
            </h3>
            <button
              id="export-data-btn"
              onClick={(e) => {
                if (isInspectorMode) handleElementInspectClick(e, 'export-data-btn', 'button', 'Скачать отчет');
                else alert('Экспорт данных сформирован!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-lg text-xs font-medium border border-purple-500/40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Скачать отчет
            </button>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-1.5 font-medium text-slate-300">
              <span>Заказ #9421</span>
              <span className="text-emerald-400">Выполнен</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Пользователь: {email || 'trader@autoclick.io'}</span>
              <span>Монеты: {coins} PTS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
