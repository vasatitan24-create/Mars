import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

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

  // Track network requests to determine page load activity
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function() {
      pendingRequests++;
      notifyStatus();
      return originalFetch.apply(this, arguments).finally(function() {
        pendingRequests = Math.max(0, pendingRequests - 1);
        notifyStatus();
      });
    };
  }

  var originalXHR = window.XMLHttpRequest;
  if (originalXHR) {
    var origOpen = originalXHR.prototype.open;
    var origSend = originalXHR.prototype.send;
    originalXHR.prototype.open = function() {
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

  // Proxy endpoint to load external websites without CSP/X-Frame-Options blocks
  app.get('/api/proxy', async (req: Request, res: Response) => {
    const targetUrl = req.query.url as string;
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

    try {
      const response = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile; rv:128.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      
      // If not HTML (e.g. image, css, script), pipe the binary or text through
      if (!contentType.includes('text/html')) {
        res.setHeader('Content-Type', contentType);
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      }

      let html = await response.text();

      // Inject base tag so relative links and assets resolve to target host
      const baseTag = `<base href="${parsedUrl.origin}${parsedUrl.pathname}">`;
      const runtimeScript = `<script src="/api/injected-runtime.js"></script>`;

      // Strip existing CSP meta tags to prevent script blocks
      html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

      // Inject base tag and our runtime script into <head> or at start
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}${runtimeScript}`);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', `<html><head>${baseTag}${runtimeScript}</head>`);
      } else {
        html = `${baseTag}${runtimeScript}${html}`;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Explicitly allow embedding in iframe
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Access-Control-Allow-Origin', '*');

      res.send(html);
    } catch (err: any) {
      res.status(502).send(`
        <div style="font-family: sans-serif; padding: 24px; text-align: center; color: #ef4444; background: #0f172a; min-height: 100vh;">
          <h2 style="color: #f87171;">Ошибка загрузки сайта</h2>
          <p style="color: #94a3b8;">Не удалось подключиться к ${parsedUrl.href}</p>
          <pre style="background: #1e293b; color: #cbd5e1; padding: 12px; border-radius: 8px; max-width: 600px; margin: 16px auto; font-size: 13px;">${err?.message || 'Network error'}</pre>
          <p style="color: #64748b; font-size: 13px;">Проверьте правильность URL или воспользуйтесь встроенным интерактивным тестовым полигоном.</p>
        </div>
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
