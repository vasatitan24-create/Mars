import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(express.raw({ type: ['application/octet-stream', 'multipart/form-data'], limit: '50mb' }));
  app.use(express.text({ type: ['text/plain', 'application/xml', 'text/xml'], limit: '50mb' }));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Ping endpoint for adaptive internet speed measurement
  app.get('/api/ping', (req: Request, res: Response) => {
    const clientTimestamp = Number(req.query.t) || Date.now();
    res.json({
      serverTime: Date.now(),
      clientTimestamp,
      latency: Math.max(1, Date.now() - clientTimestamp)
    });
  });

  // Injected Auto-Clicker Runtime Script for proxied web pages
  app.get('/api/injected-runtime.js', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
(function() {
  if (window.__AUTOCLICKER_INITIALIZED__) return;
  window.__AUTOCLICKER_INITIALIZED__ = true;

  console.log('[AutoClicker Runtime] Injected into:', window.location.href);

  var isInspectorActive = false;
  var hoveredElement = null;
  var hoverOverlay = null;
  var pendingRequests = 0;

  // Helper to resolve and proxy URLs for target origin
  function getProxiedApiUrl(rawUrl) {
    try {
      if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
      if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.includes('/api/proxy?url=')) return rawUrl;
      var baseEl = document.querySelector('base');
      var baseHref = baseEl ? baseEl.href : window.location.href;
      var resolved = new URL(rawUrl, baseHref).href;
      var currentProxyParam = new URL(window.location.href).searchParams.get('url');
      if (currentProxyParam) {
        var pageOrigin = new URL(currentProxyParam).origin;
        if (resolved.startsWith(pageOrigin)) {
          return '/api/proxy?url=' + encodeURIComponent(resolved);
        }
      }
    } catch(e) {}
    return rawUrl;
  }

  // Intercept fetch to route target-origin API calls through proxy and track activity
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function(input, init) {
      try {
        if (typeof input === 'string') {
          input = getProxiedApiUrl(input);
        } else if (input && input.url) {
          var newUrl = getProxiedApiUrl(input.url);
          if (newUrl !== input.url && typeof Request !== 'undefined') {
            input = new Request(newUrl, input);
          }
        }
      } catch(e) {}

      pendingRequests++;
      notifyStatus();
      return originalFetch.apply(this, arguments).finally(function() {
        pendingRequests = Math.max(0, pendingRequests - 1);
        notifyStatus();
      });
    };
  }

  // Intercept XHR to route target-origin calls through proxy and track activity
  var originalXHR = window.XMLHttpRequest;
  if (originalXHR) {
    var origOpen = originalXHR.prototype.open;
    var origSend = originalXHR.prototype.send;
    originalXHR.prototype.open = function(method, url, async, user, password) {
      try {
        arguments[1] = getProxiedApiUrl(url);
      } catch(e) {}
      this._tracked = true;
      return origOpen.apply(this, arguments);
    };
    originalXHR.prototype.send = function() {
      if (this._tracked) {
        pendingRequests++;
        notifyStatus();
        this.addEventListener('loadend', function() {
          pendingRequests = Math.max(0, pendingRequests - 1);
          notifyStatus();
        });
      }
      return origSend.apply(this, arguments);
    };
  }

  // Intercept all form submissions (including login forms) and rewrite action to /api/proxy
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form) return;
    try {
      var baseEl = document.querySelector('base');
      var baseHref = baseEl ? baseEl.href : window.location.href;
      var action = form.getAttribute('action') || '';
      if (e.submitter && e.submitter.getAttribute('formaction')) {
        action = e.submitter.getAttribute('formaction');
      }
      var targetUrl = new URL(action, baseHref).href;
      if (targetUrl && !targetUrl.includes('/api/proxy?url=')) {
        form.action = '/api/proxy?url=' + encodeURIComponent(targetUrl);
      }
    } catch(err) {}
  }, true);

  function notifyStatus() {
    try {
      window.parent.postMessage({
        type: 'PAGE_STATUS',
        isBusy: pendingRequests > 0 || document.readyState !== 'complete',
        pendingRequests: pendingRequests,
        readyState: document.readyState,
        url: window.location.href
      }, '*');
    } catch(e) {}
  }

  // Monitor DOM ready
  window.addEventListener('DOMContentLoaded', notifyStatus);
  window.addEventListener('load', notifyStatus);

  // Periodic status update
  setInterval(notifyStatus, 800);

  // Visual Overlay for element picker
  function createHoverOverlay() {
    if (hoverOverlay) return hoverOverlay;
    var el = document.createElement('div');
    el.id = '__autoclicker_picker_overlay';
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '2147483647';
    el.style.border = '2px solid #3b82f6';
    el.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    el.style.transition = 'all 0.08s ease-out';
    el.style.borderRadius = '4px';
    el.style.display = 'none';

    var tagBadge = document.createElement('div');
    tagBadge.id = '__autoclicker_picker_badge';
    tagBadge.style.position = 'absolute';
    tagBadge.style.top = '-24px';
    tagBadge.style.left = '0';
    tagBadge.style.background = '#1e293b';
    tagBadge.style.color = '#fff';
    tagBadge.style.fontFamily = 'monospace';
    tagBadge.style.fontSize = '11px';
    tagBadge.style.padding = '2px 6px';
    tagBadge.style.borderRadius = '3px';
    tagBadge.style.whiteSpace = 'nowrap';
    tagBadge.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    el.appendChild(tagBadge);

    document.body.appendChild(el);
    hoverOverlay = el;
    return el;
  }

  function generateSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.id && !el.id.startsWith('__autoclicker')) return '#' + CSS.escape(el.id);
    
    // Check for useful attributes
    if (el.getAttribute('data-testid')) {
      return '[' + 'data-testid="' + CSS.escape(el.getAttribute('data-testid')) + '"]';
    }
    if (el.getAttribute('name')) {
      return el.tagName.toLowerCase() + '[name="' + CSS.escape(el.getAttribute('name')) + '"]';
    }
    if (el.tagName.toLowerCase() === 'a' && el.getAttribute('href')) {
      var href = el.getAttribute('href');
      if (href && !href.startsWith('javascript:')) {
        return 'a[href*="' + CSS.escape(href.substring(0, 30)) + '"]';
      }
    }
    if (el.tagName.toLowerCase() === 'button' || el.getAttribute('role') === 'button') {
      var text = (el.innerText || el.textContent || '').trim();
      if (text && text.length <= 30) {
        return el.tagName.toLowerCase() + ':contains("' + text.replace(/"/g, '\\"') + '")';
      }
    }

    // Build unique path
    var path = [];
    var curr = el;
    while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== document.body) {
      var selector = curr.tagName.toLowerCase();
      if (curr.id && !curr.id.startsWith('__autoclicker')) {
        path.unshift('#' + CSS.escape(curr.id));
        break;
      }
      var parent = curr.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(child) {
          return child.tagName === curr.tagName;
        });
        if (siblings.length > 1) {
          var index = siblings.indexOf(curr) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      path.unshift(selector);
      curr = parent;
      if (path.length >= 4) break;
    }
    return path.join(' > ');
  }

  function onMouseMove(e) {
    if (!isInspectorActive) return;
    var target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === hoverOverlay || target.id && target.id.startsWith('__autoclicker')) return;

    hoveredElement = target;
    var overlay = createHoverOverlay();
    var rect = target.getBoundingClientRect();

    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    var badge = overlay.querySelector('#__autoclicker_picker_badge');
    if (badge) {
      var tag = target.tagName.toLowerCase();
      var textSnippet = (target.innerText || target.value || target.getAttribute('aria-label') || '').trim();
      if (textSnippet.length > 20) textSnippet = textSnippet.slice(0, 20) + '...';
      badge.textContent = tag + (textSnippet ? ' "' + textSnippet + '"' : '');
    }
  }

  function onDocumentClick(e) {
    if (!isInspectorActive) return;
    e.preventDefault();
    e.stopPropagation();

    var target = hoveredElement || e.target;
    if (!target || target.id && target.id.startsWith('__autoclicker')) return;

    var selector = generateSelector(target);
    var text = (target.innerText || target.textContent || target.value || target.getAttribute('aria-label') || '').trim();
    var rect = target.getBoundingClientRect();

    console.log('[AutoClicker] Target selected:', selector, text);

    window.parent.postMessage({
      type: 'TARGET_PICKED',
      target: {
        selector: selector,
        tag: target.tagName.toLowerCase(),
        text: text ? text.slice(0, 50) : '',
        id: target.id || '',
        name: target.getAttribute('name') || '',
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2)
      }
    }, '*');

    // Visual ripple effect
    showClickRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, '#10b981');
  }

  function showClickRipple(x, y, color) {
    var ripple = document.createElement('div');
    ripple.style.position = 'fixed';
    ripple.style.left = (x - 20) + 'px';
    ripple.style.top = (y - 20) + 'px';
    ripple.style.width = '40px';
    ripple.style.height = '40px';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = color || '#ef4444';
    ripple.style.opacity = '0.8';
    ripple.style.transform = 'scale(0.3)';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '2147483647';
    ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';

    document.body.appendChild(ripple);
    requestAnimationFrame(function() {
      ripple.style.transform = 'scale(1.8)';
      ripple.style.opacity = '0';
    });
    setTimeout(function() {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 450);
  }

  function findElement(selector) {
    if (!selector) return null;
    try {
      // 1. Check custom :contains syntax
      if (selector.includes(':contains(')) {
        var match = selector.match(/^(.*?):contains\("([^"]+)"\)$/);
        if (match) {
          var baseTag = match[1] || '*';
          var textToFind = match[2].toLowerCase();
          var candidates = document.querySelectorAll(baseTag);
          for (var i = 0; i < candidates.length; i++) {
            var cText = (candidates[i].innerText || candidates[i].textContent || '').toLowerCase();
            if (cText.includes(textToFind)) {
              return candidates[i];
            }
          }
        }
      }

      // 2. Standard CSS selector
      var el = document.querySelector(selector);
      if (el) return el;
    } catch(err) {}

    // 3. Fallback: text search in buttons, links, inputs
    var buttonsAndLinks = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]');
    for (var j = 0; j < buttonsAndLinks.length; j++) {
      var item = buttonsAndLinks[j];
      var t = (item.innerText || item.textContent || item.value || '').trim();
      if (t && (selector.includes(t) || t.includes(selector))) {
        return item;
      }
    }

    return null;
  }

  function executeStep(step) {
    var el = findElement(step.selector);
    var rect = el ? el.getBoundingClientRect() : null;
    var x = rect ? (rect.left + rect.width / 2) : (step.x || window.innerWidth / 2);
    var y = rect ? (rect.top + rect.height / 2) : (step.y || window.innerHeight / 2);

    if (step.action === 'wait_element') {
      if (el) {
        window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: true, message: 'Элемент найден' }, '*');
      } else {
        window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: false, notFound: true, message: 'Ожидание появления...' }, '*');
      }
      return;
    }

    if (!el && step.action !== 'delay' && step.action !== 'scroll') {
      window.parent.postMessage({
        type: 'STEP_RESULT',
        stepId: step.id,
        success: false,
        notFound: true,
        message: 'Элемент не найден: ' + (step.selector || step.label)
      }, '*');
      return;
    }

    if (step.action === 'scroll') {
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (step.scrollY != null) {
        window.scrollTo({ top: step.scrollY, behavior: 'smooth' });
      }
      window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: true }, '*');
      return;
    }

    if (step.action === 'type') {
      if (el) {
        el.focus();
        el.value = step.textValue || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        showClickRipple(x, y, '#8b5cf6');
      }
      window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: true }, '*');
      return;
    }

    // Default: Click or Double Click
    if (el) {
      showClickRipple(x, y, '#ef4444');
      
      // Highlight element briefly
      var prevOutline = el.style.outline;
      el.style.outline = '3px solid #ef4444';
      setTimeout(function() {
        el.style.outline = prevOutline;
      }, 350);

      // Mouse events sequence
      var opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
      el.dispatchEvent(new MouseEvent('mouseover', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.click();

      if (step.action === 'double_click') {
        setTimeout(function() {
          el.dispatchEvent(new MouseEvent('dblclick', opts));
        }, 50);
      }
    }

    window.parent.postMessage({
      type: 'STEP_RESULT',
      stepId: step.id,
      success: true,
      x: x,
      y: y
    }, '*');
  }

  // Listen for control commands from parent application
  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'SET_INSPECTOR_MODE') {
      isInspectorActive = !!data.active;
      if (!isInspectorActive && hoverOverlay) {
        hoverOverlay.style.display = 'none';
      }
      console.log('[AutoClicker] Inspector mode:', isInspectorActive);
    } else if (data.type === 'EXECUTE_STEP') {
      executeStep(data.step);
    } else if (data.type === 'HIGHLIGHT_TARGET') {
      var target = findElement(data.selector);
      if (target) {
        var r = target.getBoundingClientRect();
        showClickRipple(r.left + r.width / 2, r.top + r.height / 2, '#3b82f6');
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onDocumentClick, true);

  console.log('[AutoClicker Runtime] Ready to receive macro commands');
})();
    `);
  });

  // --- Advanced Server-Side Session & Cookie Management for Proxied Websites ---
  class ProxyCookieJar {
    private stores = new Map<string, Map<string, string>>();

    private getDomain(hostname: string): string {
      const parts = hostname.toLowerCase().split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.');
      }
      return hostname.toLowerCase();
    }

    public saveSetCookies(hostname: string, setCookieHeaders: string[]) {
      const domain = this.getDomain(hostname);
      if (!this.stores.has(domain)) {
        this.stores.set(domain, new Map());
      }
      const store = this.stores.get(domain)!;

      for (const sc of setCookieHeaders) {
        if (!sc) continue;
        const firstPart = sc.split(';')[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx > 0) {
          const name = firstPart.substring(0, eqIdx).trim();
          const val = firstPart.substring(eqIdx + 1).trim();
          const lower = sc.toLowerCase();
          if (
            val === '' ||
            val.toLowerCase() === 'deleted' ||
            lower.includes('max-age=0') ||
            lower.includes('expires=thu, 01 jan 1970')
          ) {
            store.delete(name);
          } else {
            store.set(name, val);
          }
        }
      }
    }

    public getCookieHeader(hostname: string, incomingCookieHeader?: string): string {
      const domain = this.getDomain(hostname);
      const store = this.stores.get(domain);
      const cookieMap = new Map<string, string>();

      // Stored server cookies
      if (store) {
        store.forEach((val, key) => {
          cookieMap.set(key, val);
        });
      }

      // Incoming client cookies
      if (incomingCookieHeader) {
        const parts = incomingCookieHeader.split(';');
        for (const part of parts) {
          const eqIdx = part.indexOf('=');
          if (eqIdx > 0) {
            const key = part.substring(0, eqIdx).trim();
            const val = part.substring(eqIdx + 1).trim();
            cookieMap.set(key, val);
          }
        }
      }

      const pairs: string[] = [];
      cookieMap.forEach((val, key) => {
        pairs.push(`${key}=${val}`);
      });
      return pairs.join('; ');
    }

    public getCookiesCount(hostname?: string): number {
      if (hostname) {
        return this.stores.get(this.getDomain(hostname))?.size || 0;
      }
      let total = 0;
      this.stores.forEach((store) => {
        total += store.size;
      });
      return total;
    }

    public clear(hostname?: string) {
      if (hostname) {
        this.stores.delete(this.getDomain(hostname));
      } else {
        this.stores.clear();
      }
    }
  }

  const cookieJar = new ProxyCookieJar();

  function getSetCookies(headers: Headers): string[] {
    if (typeof (headers as any).getSetCookie === 'function') {
      return (headers as any).getSetCookie();
    }
    const sc = headers.get('set-cookie');
    return sc ? [sc] : [];
  }

  function getRequestBody(req: Request): any {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return undefined;
    }
    if (Buffer.isBuffer(req.body)) {
      return req.body;
    }
    if (typeof req.body === 'string') {
      return req.body;
    }
    if (req.body && typeof req.body === 'object') {
      const cType = (req.headers['content-type'] || '').toLowerCase();
      if (cType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(req.body)) {
          if (Array.isArray(v)) {
            v.forEach((val) => params.append(k, String(val)));
          } else {
            params.append(k, String(v));
          }
        }
        return params.toString();
      }
      return JSON.stringify(req.body);
    }
    return undefined;
  }

  function applySetCookiesToResponse(res: Response, setCookies: string[]) {
    for (const sc of setCookies) {
      if (!sc) continue;
      // Strip Domain=... so browser allows setting cookie on proxy origin
      let modified = sc.replace(/Domain=[^;]+;?/gi, '');
      // Ensure cross-origin iframe allows session cookies
      modified = modified.replace(/SameSite=(Strict|Lax)/gi, 'SameSite=None');
      if (!modified.toLowerCase().includes('samesite=')) {
        modified += '; SameSite=None';
      }
      if (!modified.toLowerCase().includes('secure')) {
        modified += '; Secure';
      }
      res.append('Set-Cookie', modified);
    }
  }

  function generateInlineRuntimeJs(targetUrl: URL, proxyOrigin: string): string {
    return `
(function() {
  if (window.__AUTOCLICKER_INITIALIZED__) return;
  window.__AUTOCLICKER_INITIALIZED__ = true;

  window.__AUTOCLICKER_TARGET_ORIGIN__ = ${JSON.stringify(targetUrl.origin)};
  window.__AUTOCLICKER_TARGET_URL__ = ${JSON.stringify(targetUrl.href)};
  window.__AUTOCLICKER_PROXY_ORIGIN__ = ${JSON.stringify(proxyOrigin)};

  // Frame anti-buster protection
  try {
    Object.defineProperty(window, 'top', { get: function() { return window.self; }, set: function() {}, configurable: true });
    Object.defineProperty(window, 'parent', { get: function() { return window.self; }, set: function() {}, configurable: true });
    Object.defineProperty(window, 'frameElement', { get: function() { return null; }, set: function() {}, configurable: true });
  } catch(e) {}

  var isInspectorActive = false;
  var hoveredElement = null;
  var hoverOverlay = null;
  var pendingRequests = 0;

  // Resolve any URL relative to target website, preventing accidental self-proxy loops
  function resolveTargetUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    raw = raw.trim();
    if (raw.startsWith('javascript:') || raw.startsWith('#') || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return '';
    }
    if (raw.includes('/api/proxy?url=')) {
      return raw;
    }
    try {
      var baseEl = document.querySelector('base');
      var baseHref = (baseEl && baseEl.href) ? baseEl.href : window.__AUTOCLICKER_TARGET_URL__;
      var resolved = new URL(raw, baseHref);

      // If resolved origin is the proxy app itself, remap to target origin
      if (resolved.origin === window.__AUTOCLICKER_PROXY_ORIGIN__) {
        return window.__AUTOCLICKER_TARGET_ORIGIN__ + resolved.pathname + resolved.search + resolved.hash;
      }
      return resolved.href;
    } catch(e) {
      return raw;
    }
  }

  function getProxiedUrl(rawUrl) {
    var resolved = resolveTargetUrl(rawUrl);
    if (!resolved) return rawUrl;
    if (resolved.includes('/api/proxy?url=')) return resolved;
    return '/api/proxy?url=' + encodeURIComponent(resolved);
  }

  // Intercept window.open
  window.open = function(url) {
    if (url) {
      var proxied = getProxiedUrl(url);
      window.location.href = proxied;
      return window;
    }
    return null;
  };

  // Intercept fetch
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function(input, init) {
      try {
        if (typeof input === 'string') {
          input = getProxiedUrl(input);
        } else if (input && input.url) {
          var pUrl = getProxiedUrl(input.url);
          if (pUrl !== input.url && typeof Request !== 'undefined') {
            input = new Request(pUrl, input);
          }
        }
      } catch(e) {}

      pendingRequests++;
      notifyStatus();
      return originalFetch.apply(this, arguments).finally(function() {
        pendingRequests = Math.max(0, pendingRequests - 1);
        notifyStatus();
      });
    };
  }

  // Intercept XHR
  var originalXHR = window.XMLHttpRequest;
  if (originalXHR) {
    var origOpen = originalXHR.prototype.open;
    var origSend = originalXHR.prototype.send;
    originalXHR.prototype.open = function(method, url, async, user, password) {
      try {
        arguments[1] = getProxiedUrl(url);
      } catch(e) {}
      this._tracked = true;
      return origOpen.apply(this, arguments);
    };
    originalXHR.prototype.send = function() {
      if (this._tracked) {
        pendingRequests++;
        notifyStatus();
        this.addEventListener('loadend', function() {
          pendingRequests = Math.max(0, pendingRequests - 1);
          notifyStatus();
        });
      }
      return origSend.apply(this, arguments);
    };
  }

  // Intercept form submissions (including login POST forms)
  document.addEventListener('submit', function(e) {
    if (isInspectorActive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var form = e.target;
    if (!form || !form.tagName || form.tagName.toLowerCase() !== 'form') return;
    try {
      var action = form.getAttribute('action') || '';
      if (e.submitter && e.submitter.getAttribute('formaction')) {
        action = e.submitter.getAttribute('formaction');
      }
      var targetUrl = resolveTargetUrl(action || window.__AUTOCLICKER_TARGET_URL__);
      if (targetUrl && !targetUrl.includes('/api/proxy?url=')) {
        form.action = '/api/proxy?url=' + encodeURIComponent(targetUrl);
      }
    } catch(err) {}
  }, true);

  try {
    var origFormSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
      try {
        var action = this.getAttribute('action') || '';
        var targetUrl = resolveTargetUrl(action || window.__AUTOCLICKER_TARGET_URL__);
        if (targetUrl && !targetUrl.includes('/api/proxy?url=')) {
          this.action = '/api/proxy?url=' + encodeURIComponent(targetUrl);
        }
      } catch(e) {}
      return origFormSubmit.apply(this, arguments);
    };
  } catch(e) {}

  // Unified click handler: Inspector Selection vs Link Navigation
  document.addEventListener('click', function(e) {
    if (isInspectorActive) {
      e.preventDefault();
      e.stopPropagation();

      var target = hoveredElement || e.target;
      if (!target || (target.id && target.id.startsWith('__autoclicker'))) return;

      var selector = generateSelector(target);
      var text = (target.innerText || target.textContent || target.value || target.getAttribute('aria-label') || '').trim();
      var rect = target.getBoundingClientRect();

      window.parent.postMessage({
        type: 'TARGET_PICKED',
        target: {
          selector: selector,
          tag: target.tagName.toLowerCase(),
          text: text ? text.slice(0, 50) : '',
          id: target.id || '',
          name: target.getAttribute('name') || '',
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2)
        }
      }, '*');

      showClickRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, '#10b981');
      return;
    }

    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) {
      var href = a.getAttribute('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        var resolved = resolveTargetUrl(href);
        if (resolved && !resolved.includes('/api/proxy?url=')) {
          e.preventDefault();
          window.location.href = '/api/proxy?url=' + encodeURIComponent(resolved);
        }
      }
    }
  }, true);

  // Inspector Hover Overlay
  function createHoverOverlay() {
    if (hoverOverlay && document.body.contains(hoverOverlay)) return hoverOverlay;
    var el = document.createElement('div');
    el.id = '__autoclicker_picker_overlay';
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '2147483647';
    el.style.border = '2px solid #3b82f6';
    el.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    el.style.transition = 'all 0.05s ease-out';
    el.style.borderRadius = '4px';
    el.style.display = 'none';

    var tagBadge = document.createElement('div');
    tagBadge.id = '__autoclicker_picker_badge';
    tagBadge.style.position = 'absolute';
    tagBadge.style.top = '-24px';
    tagBadge.style.left = '0';
    tagBadge.style.background = '#0f172a';
    tagBadge.style.color = '#38bdf8';
    tagBadge.style.fontFamily = 'monospace';
    tagBadge.style.fontSize = '11px';
    tagBadge.style.fontWeight = 'bold';
    tagBadge.style.padding = '2px 6px';
    tagBadge.style.borderRadius = '4px';
    tagBadge.style.border = '1px solid #1e293b';
    tagBadge.style.whiteSpace = 'nowrap';
    tagBadge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
    el.appendChild(tagBadge);

    document.body.appendChild(el);
    hoverOverlay = el;
    return el;
  }

  function generateSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.id && !el.id.startsWith('__autoclicker')) return '#' + CSS.escape(el.id);

    if (el.getAttribute('data-testid')) {
      return '[' + 'data-testid="' + CSS.escape(el.getAttribute('data-testid')) + '"]';
    }
    if (el.getAttribute('name')) {
      return el.tagName.toLowerCase() + '[name="' + CSS.escape(el.getAttribute('name')) + '"]';
    }
    if (el.tagName.toLowerCase() === 'a' && el.getAttribute('href')) {
      var href = el.getAttribute('href');
      if (href && !href.startsWith('javascript:')) {
        return 'a[href*="' + CSS.escape(href.substring(0, 30)) + '"]';
      }
    }
    if (el.className && typeof el.className === 'string') {
      var validClasses = el.className.split(/\\s+/).filter(function(c) {
        return c && !c.startsWith('__') && !c.includes(':') && !c.includes('/') && !c.includes('[');
      });
      if (validClasses.length > 0) {
        return el.tagName.toLowerCase() + '.' + validClasses.slice(0, 2).map(CSS.escape).join('.');
      }
    }

    var text = (el.innerText || el.textContent || '').trim();
    if (text && text.length > 0 && text.length < 25) {
      return el.tagName.toLowerCase() + ':contains("' + text.replace(/"/g, '') + '")';
    }

    var parent = el.parentElement;
    if (parent && parent !== document.body) {
      var siblings = Array.prototype.slice.call(parent.children);
      var idx = siblings.indexOf(el) + 1;
      return generateSelector(parent) + ' > ' + el.tagName.toLowerCase() + ':nth-child(' + idx + ')';
    }

    return el.tagName.toLowerCase();
  }

  function onMouseMove(e) {
    if (!isInspectorActive) return;
    var target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || (target.id && target.id.startsWith('__autoclicker'))) return;

    hoveredElement = target;
    var overlay = createHoverOverlay();
    var rect = target.getBoundingClientRect();

    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    var badge = overlay.querySelector('#__autoclicker_picker_badge');
    if (badge) {
      var tag = target.tagName.toLowerCase();
      var textSnippet = (target.innerText || target.value || target.getAttribute('aria-label') || '').trim();
      if (textSnippet.length > 20) textSnippet = textSnippet.slice(0, 20) + '...';
      badge.textContent = tag + (textSnippet ? ' "' + textSnippet + '"' : '');
    }
  }

  function showClickRipple(x, y, color) {
    var ripple = document.createElement('div');
    ripple.style.position = 'fixed';
    ripple.style.left = (x - 20) + 'px';
    ripple.style.top = (y - 20) + 'px';
    ripple.style.width = '40px';
    ripple.style.height = '40px';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = color || '#ef4444';
    ripple.style.opacity = '0.8';
    ripple.style.transform = 'scale(0.3)';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '2147483647';
    ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';

    document.body.appendChild(ripple);
    requestAnimationFrame(function() {
      ripple.style.transform = 'scale(1.8)';
      ripple.style.opacity = '0';
    });
    setTimeout(function() {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 450);
  }

  function findElement(selector) {
    if (!selector) return null;
    try {
      if (selector.includes(':contains(')) {
        var match = selector.match(/^(.*?):contains\\("([^"]+)"\\)$/);
        if (match) {
          var baseTag = match[1] || '*';
          var textToFind = match[2].toLowerCase();
          var candidates = document.querySelectorAll(baseTag);
          for (var i = 0; i < candidates.length; i++) {
            var cText = (candidates[i].innerText || candidates[i].textContent || '').toLowerCase();
            if (cText.includes(textToFind)) {
              return candidates[i];
            }
          }
        }
      }
      var el = document.querySelector(selector);
      if (el) return el;
    } catch(err) {}

    var candidates2 = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], input, textarea');
    for (var j = 0; j < candidates2.length; j++) {
      var item = candidates2[j];
      var t = (item.innerText || item.textContent || item.value || '').trim();
      if (t && (selector.includes(t) || t.includes(selector))) {
        return item;
      }
    }
    return null;
  }

  function executeStep(step) {
    var el = findElement(step.selector);
    var rect = el ? el.getBoundingClientRect() : null;
    var x = rect ? (rect.left + rect.width / 2) : (step.x || window.innerWidth / 2);
    var y = rect ? (rect.top + rect.height / 2) : (step.y || window.innerHeight / 2);

    if (step.action === 'wait_element') {
      if (el) {
        window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: true, message: 'Элемент найден' }, '*');
      } else {
        window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: false, notFound: true, message: 'Ожидание появления...' }, '*');
      }
      return;
    }

    if (!el && step.action !== 'delay' && step.action !== 'scroll') {
      window.parent.postMessage({
        type: 'STEP_RESULT',
        stepId: step.id,
        success: false,
        notFound: true,
        message: 'Элемент не найден: ' + (step.selector || step.label)
      }, '*');
      return;
    }

    if (step.action === 'scroll') {
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (step.scrollY != null) {
        window.scrollTo({ top: step.scrollY, behavior: 'smooth' });
      }
      window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: true }, '*');
      return;
    }

    if (step.action === 'type') {
      if (el) {
        el.focus();
        el.value = step.textValue || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        showClickRipple(x, y, '#8b5cf6');
      }
      window.parent.postMessage({ type: 'STEP_RESULT', stepId: step.id, success: true }, '*');
      return;
    }

    // Default: Click or Double Click
    if (el) {
      showClickRipple(x, y, '#ef4444');
      var prevOutline = el.style.outline;
      el.style.outline = '3px solid #ef4444';
      setTimeout(function() {
        if (el) el.style.outline = prevOutline;
      }, 350);

      var opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
      el.dispatchEvent(new MouseEvent('mouseover', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.click();

      if (step.action === 'double_click') {
        setTimeout(function() {
          el.dispatchEvent(new MouseEvent('dblclick', opts));
        }, 50);
      }
    }

    window.parent.postMessage({
      type: 'STEP_RESULT',
      stepId: step.id,
      success: true,
      x: x,
      y: y
    }, '*');
  }

  function notifyStatus() {
    try {
      window.parent.postMessage({
        type: 'PAGE_STATUS',
        isBusy: pendingRequests > 0 || document.readyState !== 'complete',
        pendingRequests: pendingRequests,
        readyState: document.readyState,
        url: window.__AUTOCLICKER_TARGET_URL__
      }, '*');
    } catch(e) {}
  }

  window.addEventListener('DOMContentLoaded', notifyStatus);
  window.addEventListener('load', notifyStatus);
  setInterval(notifyStatus, 1000);

  window.addEventListener('message', function(e) {
    var data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'SET_INSPECTOR_MODE') {
      isInspectorActive = !!data.active;
      if (!isInspectorActive && hoverOverlay) {
        hoverOverlay.style.display = 'none';
      }
      console.log('[AutoClicker] Inspector mode active:', isInspectorActive);
    } else if (data.type === 'EXECUTE_STEP') {
      executeStep(data.step);
    } else if (data.type === 'HIGHLIGHT_TARGET') {
      var target = findElement(data.selector);
      if (target) {
        var r = target.getBoundingClientRect();
        showClickRipple(r.left + r.width / 2, r.top + r.height / 2, '#3b82f6');
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });

  document.addEventListener('mousemove', onMouseMove, true);

  // Notify parent that runtime is fully connected
  try {
    window.parent.postMessage({
      type: 'RUNTIME_READY',
      url: window.__AUTOCLICKER_TARGET_URL__
    }, '*');
  } catch(e) {}

  console.log('[AutoClicker Runtime] Successfully injected & active on', window.__AUTOCLICKER_TARGET_URL__);
})();
`;
  }

  function injectScriptsIntoHtml(rawHtml: string, finalUrl: URL, proxyOrigin: string): string {
    const baseTag = `<base href="${finalUrl.origin}${finalUrl.pathname}">`;
    const runtimeScript = `<script id="__autoclicker_runtime__">${generateInlineRuntimeJs(finalUrl, proxyOrigin)}</script>`;

    let html = rawHtml
      .replace(/top\.location\s*=\s*self\.location/gi, '/* neutralized */')
      .replace(/top\.location\.href\s*=\s*location\.href/gi, '/* neutralized */')
      .replace(/if\s*\(\s*(window\.)?top\s*!==\s*(window\.)?self\s*\)/gi, 'if(false)')
      .replace(/if\s*\(\s*(window\.)?top\.location\s*!==\s*(window\.)?location\s*\)/gi, 'if(false)')
      .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
      .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}${runtimeScript}`);
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html><head>${baseTag}${runtimeScript}</head>`);
    } else {
      html = `${baseTag}${runtimeScript}${html}`;
    }

    return html;
  }

  async function fetchWithRedirectsAndCookies(
    initialUrl: URL,
    initialMethod: string,
    initialHeaders: Record<string, string>,
    initialBody: any,
    maxHops = 6
  ): Promise<{ response: globalThis.Response; finalUrl: URL }> {
    let currentUrl = initialUrl;
    let currentMethod = initialMethod.toUpperCase();
    let currentHeaders: Record<string, string> = { ...initialHeaders };
    let currentBody = initialBody;

    for (let hop = 0; hop < maxHops; hop++) {
      const cookieStr = cookieJar.getCookieHeader(currentUrl.hostname, currentHeaders['cookie']);
      if (cookieStr) {
        currentHeaders['cookie'] = cookieStr;
      }
      currentHeaders['host'] = currentUrl.host;

      if (currentMethod === 'GET' || currentMethod === 'HEAD') {
        delete currentHeaders['content-length'];
        delete currentHeaders['content-type'];
        currentBody = undefined;
      }

      const res = await fetch(currentUrl.href, {
        method: currentMethod,
        headers: currentHeaders,
        body: currentBody,
        redirect: 'manual'
      });

      const setCookies = getSetCookies(res.headers);
      if (setCookies.length > 0) {
        cookieJar.saveSetCookies(currentUrl.hostname, setCookies);
      }

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (location) {
          const nextUrl = new URL(location, currentUrl.href);
          currentUrl = nextUrl;

          // In standard HTTP redirects (301, 302, 303), clients switch POST to GET
          if (res.status === 301 || res.status === 302 || res.status === 303) {
            currentMethod = 'GET';
            currentBody = undefined;
            delete currentHeaders['content-type'];
            delete currentHeaders['content-length'];
          }
          currentHeaders['referer'] = currentUrl.href;
          continue;
        }
      }

      return { response: res, finalUrl: currentUrl };
    }

    const res = await fetch(currentUrl.href, {
      method: currentMethod,
      headers: currentHeaders,
      body: currentBody,
      redirect: 'follow'
    });
    return { response: res, finalUrl: currentUrl };
  }

  // Cookie management endpoints
  app.post('/api/cookies/clear', (req: Request, res: Response) => {
    const host = req.query.host as string | undefined;
    cookieJar.clear(host);
    res.json({ ok: true, message: 'Cookies cleared successfully' });
  });

  app.get('/api/cookies/status', (req: Request, res: Response) => {
    const host = req.query.host as string | undefined;
    res.json({
      ok: true,
      cookiesCount: cookieJar.getCookiesCount(host)
    });
  });

  // Internal app route whitelist that should NOT be proxied
  const INTERNAL_APP_ROUTES = new Set([
    '/api/health',
    '/api/ping',
    '/api/proxy',
    '/api/injected-runtime.js',
    '/api/cookies/clear',
    '/api/cookies/status'
  ]);

  // Intercept subresource or relative requests made by pages inside the proxy iframe
  app.use(async (req: Request, res: Response, next) => {
    if (INTERNAL_APP_ROUTES.has(req.path)) {
      return next();
    }

    // Check if the request was initiated from within our /api/proxy iframe
    const referer = (req.headers.referer || req.headers.referrer) as string | undefined;
    const isFromProxyIframe = typeof referer === 'string' && referer.includes('/api/proxy?url=');

    // Only allow Vite/SPA root routes if NOT initiated from within the proxy iframe
    if (!isFromProxyIframe) {
      if (
        req.path.startsWith('/src/') ||
        req.path.startsWith('/@') ||
        req.path.startsWith('/node_modules/') ||
        req.path === '/' ||
        req.path === '/index.html' ||
        req.path.endsWith('.tsx') ||
        req.path.endsWith('.ts')
      ) {
        return next();
      }
    }

    if (isFromProxyIframe) {
      try {
        const refUrl = new URL(referer!);
        const targetUrlParam = refUrl.searchParams.get('url');
        if (targetUrlParam) {
          const targetOrigin = new URL(targetUrlParam).origin;
          const targetFullUrl = new URL(req.originalUrl, targetOrigin);

          // Prevent proxying to self
          if (req.headers.host && targetFullUrl.host.toLowerCase() === req.headers.host.toLowerCase()) {
            return next();
          }

          const headers: Record<string, string> = {
            'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept': (req.headers.accept as string) || '*/*',
            'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8',
            'Origin': targetOrigin,
            'Referer': targetUrlParam,
          };

          const cType = req.headers['content-type'];
          if (cType) headers['content-type'] = cType;

          const body = getRequestBody(req);

          const { response: proxiedRes, finalUrl } = await fetchWithRedirectsAndCookies(
            targetFullUrl,
            req.method,
            headers,
            body
          );

          res.status(proxiedRes.status);
          const resCType = proxiedRes.headers.get('content-type') || '';
          if (resCType) res.setHeader('Content-Type', resCType);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Credentials', 'true');

          const setCookies = getSetCookies(proxiedRes.headers);
          if (setCookies.length > 0) {
            applySetCookiesToResponse(res, setCookies);
          }

          if (resCType.includes('text/html')) {
            let html = await proxiedRes.text();
            const proxyOrigin = `${req.protocol}://${req.headers.host || 'localhost:3000'}`;
            html = injectScriptsIntoHtml(html, finalUrl, proxyOrigin);
            res.send(html);
            return;
          }

          const buffer = await proxiedRes.arrayBuffer();
          res.send(Buffer.from(buffer));
          return;
        }
      } catch (err) {
        // Fallback to next
      }
    }

    next();
  });

  // Universal Proxy endpoint (GET, POST, PUT, DELETE, etc.) to load external sites with login/session support
  app.all('/api/proxy', async (req: Request, res: Response) => {
    let targetUrl = (req.query.url as string) || (req.body?.targetUrl as string);
    if (!targetUrl) {
      res.status(400).send('Missing url parameter');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch (err) {
      res.status(400).send('Invalid URL format');
      return;
    }

    // PREVENT SELF-PROXYING LOOP:
    // If targetUrl points to our own server, do NOT proxy it!
    const hostHeader = (req.headers.host || '').toLowerCase();
    if (hostHeader && parsedUrl.host.toLowerCase() === hostHeader) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html lang="ru"><head><meta charset="utf-8"></head>
        <body style="background:#0b0f19;color:#f87171;font-family:sans-serif;padding:30px;text-align:center;">
          <h3>⚠️ Предотвращено зацикливание</h3>
          <p>Нельзя открыть адрес самого автокликера через туннель. Пожалуйста, укажите внешний сайт (например, ya.ru или google.com).</p>
        </body></html>
      `);
      return;
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': (req.headers.accept as string) || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'Origin': parsedUrl.origin,
        'Referer': parsedUrl.href,
      };

      const cType = req.headers['content-type'];
      if (cType) headers['content-type'] = cType;

      const body = getRequestBody(req);

      const { response, finalUrl } = await fetchWithRedirectsAndCookies(
        parsedUrl,
        req.method,
        headers,
        body
      );

      const contentType = response.headers.get('content-type') || '';
      res.status(response.status);

      const setCookies = getSetCookies(response.headers);
      if (setCookies.length > 0) {
        applySetCookiesToResponse(res, setCookies);
      }

      // If non-HTML (e.g. image, api JSON, css, script)
      if (!contentType.includes('text/html')) {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      }

      let html = await response.text();
      const proxyOrigin = `${req.protocol}://${req.headers.host || 'localhost:3000'}`;
      html = injectScriptsIntoHtml(html, finalUrl, proxyOrigin);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');
      res.removeHeader('Cross-Origin-Opener-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      res.send(html);
    } catch (err: any) {
      res.status(502).send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <title>Сайт защищен или недоступен для прямого фрейма</title>
          <style>
            body { margin: 0; padding: 32px 16px; font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
            .card { max-width: 540px; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }
            h2 { color: #f87171; margin-top: 0; font-size: 20px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .badge { display: inline-block; background: #1e293b; color: #cbd5e1; font-family: monospace; font-size: 12px; padding: 6px 12px; border-radius: 8px; margin: 12px 0; word-break: break-all; }
            .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
            button, a { display: inline-block; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
            .btn-primary { background: #2563eb; color: #ffffff; }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-secondary { background: #1f2937; color: #e2e8f0; border: 1px solid #374151; }
            .btn-secondary:hover { background: #374151; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🛡️ Сайт защищен от отображения во фрейме</h2>
            <p>Сайт <strong>${parsedUrl.hostname}</strong> использует защитные механизмы (Cloudflare, строгий CSP или авторизацию), блокирующие прокси-сервер.</p>
            <div class="badge">${err?.message || 'ERR_CONNECTION_REFUSED'}</div>
            <div class="actions">
              <a href="${parsedUrl.href}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                ↗ Открыть ${parsedUrl.hostname} в отдельном окне
              </a>
              <button onclick="window.parent.postMessage({ type: 'SWITCH_TO_SANDBOX' }, '*')" class="btn-secondary">
                ⭐ Вернуться в интерактивный полигон автокликера
              </button>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoClicker Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
