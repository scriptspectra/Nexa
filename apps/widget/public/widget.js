(function(){"use strict";const l={WIDGET_URL:"http://localhost:3001",DEFAULT_POSITION:"bottom-right"},h=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>`,b=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;(function(){let o=null,t=null,e=null,c=!1,r=null,s=l.DEFAULT_POSITION,p=l.WIDGET_URL;const a=document.currentScript;if(a){if(r=a.getAttribute("data-organization-id"),s=a.getAttribute("data-position")||l.DEFAULT_POSITION,a.src)try{p=new URL(a.src).origin}catch(i){console.error("Echo Widget: failed to parse script src",i)}}else{const i=document.querySelectorAll('script[src*="widget"], script[src*="embed"]'),n=Array.from(i).find(d=>d.hasAttribute("data-organization-id"));if(n&&(r=n.getAttribute("data-organization-id"),s=n.getAttribute("data-position")||l.DEFAULT_POSITION,n.src))try{p=new URL(n.src).origin}catch{}}if(!r){console.error("Echo Widget: data-organization-id attribute is required");return}function g(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",f):f()}function f(){e=document.createElement("button"),e.id="echo-widget-button",e.innerHTML=h,e.style.cssText=`
      position: fixed;
      ${s==="bottom-right"?"right: 20px;":"left: 20px;"}
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
    `,e.addEventListener("click",v),e.addEventListener("mouseenter",()=>{e&&(e.style.transform="scale(1.05)")}),e.addEventListener("mouseleave",()=>{e&&(e.style.transform="scale(1)")}),document.body.appendChild(e),t=document.createElement("div"),t.id="echo-widget-container",t.style.cssText=`
      position: fixed;
      ${s==="bottom-right"?"right: 20px;":"left: 20px;"}
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
    `,o=document.createElement("iframe"),o.src=y(),o.style.cssText=`
      width: 100%;
      height: 100%;
      border: none;
    `,o.allow="microphone; clipboard-read; clipboard-write",t.appendChild(o),document.body.appendChild(t),window.addEventListener("message",m)}function y(){const i=new URLSearchParams;return i.append("organizationId",r),`${p}?${i.toString()}`}function m(i){if(i.origin!==new URL(p).origin)return;const{type:n,payload:d}=i.data;switch(n){case"close":u();break;case"resize":d.height&&t&&(t.style.height=`${d.height}px`);break}}function v(){c?u():x()}function x(){t&&e&&(c=!0,t.style.display="block",setTimeout(()=>{t&&(t.style.opacity="1",t.style.transform="translateY(0)")},10),e.innerHTML=b)}function u(){t&&e&&(c=!1,t.style.opacity="0",t.style.transform="translateY(10px)",setTimeout(()=>{t&&(t.style.display="none")},300),e.innerHTML=h,e.style.background="#3b82f6")}function w(){window.removeEventListener("message",m),t&&(t.remove(),t=null,o=null),e&&(e.remove(),e=null),c=!1}function E(i){w(),i.organizationId&&(r=i.organizationId),i.position&&(s=i.position),g()}window.EchoWidget={init:E,show:x,hide:u,destroy:w},g()})()})();
