import { EMBED_CONFIG } from './config';
import { chatBubbleIcon, closeIcon } from './icons';

(function () {
  let iframe: HTMLIFrameElement | null = null;
  let container: HTMLDivElement | null = null;
  let skeleton: HTMLDivElement | null = null;
  let button: HTMLButtonElement | null = null;
  let isOpen = false;
  let iframeLoaded = false;

  // Get configuration from script tag
  let organizationId: string | null = null;
  let position: 'bottom-right' | 'bottom-left' = EMBED_CONFIG.DEFAULT_POSITION;
  let widgetUrl = EMBED_CONFIG.WIDGET_URL;

  // Try to get the current script
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    organizationId = currentScript.getAttribute('data-organization-id');
    position = (currentScript.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || EMBED_CONFIG.DEFAULT_POSITION;
    if (currentScript.src) {
      try {
        const origin = new URL(currentScript.src).origin;
        if (!origin.includes('3002')) {
          widgetUrl = origin;
        }
      } catch (e) {
        console.error('Zephyra Widget: failed to parse script src', e);
      }
    }
  } else {
    // Fallback: find script tag by src
    const scripts = document.querySelectorAll('script[src*="widget"], script[src*="embed"]');
    const embedScript = Array.from(scripts).find(script =>
      script.hasAttribute('data-organization-id')
    ) as HTMLScriptElement;

    if (embedScript) {
      organizationId = embedScript.getAttribute('data-organization-id');
      position = (embedScript.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || EMBED_CONFIG.DEFAULT_POSITION;
      if (embedScript.src) {
        try {
          const origin = new URL(embedScript.src).origin;
          if (!origin.includes('3002')) {
            widgetUrl = origin;
          }
        } catch (e) { }
      }
    }
  }

  // Exit if no organization ID
  if (!organizationId) {
    console.error('Zephyra Widget: data-organization-id attribute is required');
    return;
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render);
    } else {
      render();
    }
  }

  function render() {
    // Create floating action button
    button = document.createElement('button');
    button.id = 'Zephyra-widget-button';
    button.innerHTML = chatBubbleIcon;
    button.style.cssText = `
      position: fixed;
      ${position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(59, 130, 246, 0.35);
      transition: all 0.2s ease;
    `;

    button.addEventListener('click', toggleWidget);
    button.addEventListener('mouseenter', () => {
      if (button) button.style.transform = 'scale(1.05)';
    });
    button.addEventListener('mouseleave', () => {
      if (button) button.style.transform = 'scale(1)';
    });

    document.body.appendChild(button);

    // Create container (hidden by default)
    container = document.createElement('div');
    container.id = 'Zephyra-widget-container';
    container.style.cssText = `
      position: fixed;
      ${position === 'bottom-right' ? 'right: 20px;' : 'left: 20px;'}
      bottom: 90px;
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 110px);
      z-index: 999998;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      display: none;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    `;

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.src = buildWidgetUrl();
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;
    // Add permissions for microphone and clipboard
    iframe.allow = 'microphone; clipboard-read; clipboard-write';

    // Create and attach skeleton overlay
    skeleton = createSkeleton();

    container.appendChild(iframe);
    container.appendChild(skeleton);
    document.body.appendChild(container);

    // Handle messages from widget
    window.addEventListener('message', handleMessage);
  }

  function injectSkeletonStyles() {
    if (document.getElementById('Zephyra-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'Zephyra-widget-styles';
    style.textContent = [
      '@keyframes Zephyra-shimmer {',
      '  0%   { background-position: -600px 0; }',
      '  100% { background-position:  600px 0; }',
      '}',
      '.Zephyra-sk {',
      '  background: linear-gradient(90deg,#efefef 25%,#e0e0e0 50%,#efefef 75%);',
      '  background-size: 1200px 100%;',
      '  animation: Zephyra-shimmer 1.6s ease-in-out infinite;',
      '  border-radius: 8px;',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function createSkeleton(): HTMLDivElement {
    injectSkeletonStyles();

    const el = document.createElement('div');
    el.id = 'Zephyra-widget-skeleton';
    el.style.cssText = [
      'position:absolute;inset:0;',
      'background:#ffffff;',
      'border-radius:16px;',
      'display:flex;flex-direction:column;',
      'z-index:1;',
      'overflow:hidden;',
      'transition:opacity 0.35s ease;',
    ].join('');

    // --- Header ---
    const header = document.createElement('div');
    header.style.cssText = [
      'display:flex;align-items:center;gap:12px;',
      'padding:14px 16px;',
      'border-bottom:1px solid #f0f0f0;',
      'background:#fafafa;',
      'flex-shrink:0;',
    ].join('');
    header.innerHTML = [
      '<div class="Zephyra-sk" style="width:38px;height:38px;border-radius:50%;flex-shrink:0;"></div>',
      '<div style="flex:1;display:flex;flex-direction:column;gap:7px;">',
      '<div class="Zephyra-sk" style="height:13px;width:55%;"></div>',
      '<div class="Zephyra-sk" style="height:10px;width:38%;"></div>',
      '</div>',
      '<div class="Zephyra-sk" style="width:28px;height:28px;border-radius:6px;flex-shrink:0;"></div>',
    ].join('');

    // --- Messages ---
    const messages = document.createElement('div');
    messages.style.cssText = [
      'flex:1;',
      'padding:16px;',
      'display:flex;flex-direction:column;gap:14px;',
      'overflow:hidden;',
    ].join('');

    function botMsg(lines: { w: string; h?: string }[]) {
      return [
        '<div style="display:flex;align-items:flex-end;gap:8px;">',
        '<div class="Zephyra-sk" style="width:30px;height:30px;border-radius:50%;flex-shrink:0;"></div>',
        '<div style="display:flex;flex-direction:column;gap:5px;">',
        ...lines.map(l =>
          `<div class="Zephyra-sk" style="height:${l.h ?? '34px'};width:${l.w};border-radius:12px 12px 12px 3px;"></div>`
        ),
        '</div>',
        '</div>',
      ].join('');
    }

    function userMsg(w: string) {
      return [
        '<div style="display:flex;justify-content:flex-end;">',
        `<div class="Zephyra-sk" style="height:34px;width:${w};border-radius:12px 12px 3px 12px;"></div>`,
        '</div>',
      ].join('');
    }

    messages.innerHTML = [
      botMsg([{ w: '180px', h: '48px' }]),
      userMsg('130px'),
      botMsg([{ w: '210px' }, { w: '150px', h: '28px' }]),
      userMsg('100px'),
      botMsg([{ w: '190px', h: '42px' }]),
    ].join('');

    // --- Input ---
    const inputArea = document.createElement('div');
    inputArea.style.cssText = [
      'padding:12px 14px;',
      'border-top:1px solid #f0f0f0;',
      'background:#fafafa;',
      'flex-shrink:0;',
      'display:flex;align-items:center;gap:10px;',
    ].join('');
    inputArea.innerHTML = [
      '<div class="Zephyra-sk" style="flex:1;height:40px;border-radius:10px;"></div>',
      '<div class="Zephyra-sk" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;"></div>',
    ].join('');

    el.appendChild(header);
    el.appendChild(messages);
    el.appendChild(inputArea);
    return el;
  }

  function hideSkeleton() {
    if (!skeleton) return;
    skeleton.style.opacity = '0';
    skeleton.style.pointerEvents = 'none';
    setTimeout(() => {
      if (skeleton) {
        skeleton.style.display = 'none';
      }
    }, 380);
  }

  function buildWidgetUrl(): string {
    const params = new URLSearchParams();
    params.append('organizationId', organizationId!);
    return `${widgetUrl}?${params.toString()}`;
  }

  function handleMessage(event: MessageEvent) {
    if (event.origin !== new URL(widgetUrl).origin) return;

    const { type, payload } = event.data;

    switch (type) {
      case 'ready':
        iframeLoaded = true;
        hideSkeleton();
        break;
      case 'close':
        hide();
        break;
      case 'resize':
        if (payload && payload.height && container) {
          container.style.height = `${payload.height}px`;
        }
        break;
    }
  }

  function toggleWidget() {
    if (isOpen) {
      hide();
    } else {
      show();
    }
  }

  function show() {
    if (container && button) {
      isOpen = true;
      container.style.display = 'block';
      // Show skeleton if iframe hasn't loaded yet
      if (!iframeLoaded && skeleton) {
        skeleton.style.display = 'flex';
        skeleton.style.opacity = '1';
        skeleton.style.pointerEvents = 'auto';

        // Fallback: hide skeleton after 8 seconds if widget server is unresponsive
        setTimeout(() => {
          if (!iframeLoaded) hideSkeleton();
        }, 8000);
      }
      // Trigger animation
      setTimeout(() => {
        if (container) {
          container.style.opacity = '1';
          container.style.transform = 'translateY(0)';
        }
      }, 10);
      // Change button icon to close
      button.innerHTML = closeIcon;
    }
  }

  function hide() {
    if (container && button) {
      isOpen = false;
      container.style.opacity = '0';
      container.style.transform = 'translateY(10px)';
      // Hide after animation
      setTimeout(() => {
        if (container) container.style.display = 'none';
      }, 300);
      // Change button icon back to chat
      button.innerHTML = chatBubbleIcon;
      button.style.background = '#3b82f6';
    }
  }

  function destroy() {
    window.removeEventListener('message', handleMessage);
    if (container) {
      container.remove();
      container = null;
      iframe = null;
      skeleton = null;
    }
    if (button) {
      button.remove();
      button = null;
    }
    isOpen = false;
    iframeLoaded = false;
  }

  // Function to reinitialize with new config
  function reinit(newConfig: { organizationId?: string; position?: 'bottom-right' | 'bottom-left' }) {
    // Destroy existing widget
    destroy();

    // Update config
    if (newConfig.organizationId) {
      organizationId = newConfig.organizationId;
    }
    if (newConfig.position) {
      position = newConfig.position;
    }

    // Reinitialize
    init();
  }

  // Expose API to global scope
  (window as any).EchoWidget = {
    init: reinit,
    show,
    hide,
    destroy
  };

  // Auto-initialize
  init();
})();
