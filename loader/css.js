/*!
 * CSS file loader for AMDR
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/xfsn/amdr
 */
(function(e,t,n){"use strict";function b(e,t,n,r){var s=d[e]=S(t);s.id=e,s[c]=function(t){!u||C(s)?(w(e,s,!0),N(n,s)):s[h]()},s[h]=function(){w(e,s),N(r,new Error("load failures."))},v[e]=setTimeout(function(){w(e,s),N(r,new Error("load timeout."))},o?3e3:7e3),i.appendChild(s),!u&&!y&&(!l||!f)&&k()}function w(e,t,n){clearTimeout(v[e]),delete v[e],d[e]=1,t[h]=t[c]="",!n}function E(e){return r.getElementsByTagName(e)[0]}function S(e){var t=r.createElement("link");return t.rel="stylesheet",t.type="text/css",t.href=e,t}function x(e,t,n){var r=S(t),s=!1,o=2;r[e]=function(){s=!0},i.appendChild(r),function u(){s?(n(!0),i.removeChild(r)):o--?setTimeout(u,0):(n(!1),i.removeChild(r))}()}function T(){a=!1;while(m.length)b.apply(e,m.shift())}function N(e,t){setTimeout(function(){e(t)})}function C(e){try{return e=e.sheet||e.styleSheet,0<(e.rules||e.cssRules).length}catch(n){return!t||!1}}function k(e,t,n,r,i){for(e in v){i=s,t=d[e];if(n=t.sheet){try{r=n.cssRules}catch(u){i=o||u.code===(u.SECURITY_ERR||1e3)}r?t[r.length?c:h]():i&&t[c]()}}y=e?setTimeout(k,100):0}var r=e.document,i=E("head")||E("script"),s="webkitAppearance"in r.documentElement.style,o="[object Opera]"==={}.toString.call(e.opera),u=t||o,a=!u,f=u||n,l=u?!1:n,c="onload",h="onerror",p={},d={},v={},m=[],g=0,y=0;u||x(c,"data:text/css;base64,",function(e){f=e,n!==l&&T()}),u||x(h,s?"data:":"data:,",function(e){l=e,n!==c&&T()}),define({load:function(t,n,r){var i=p[t]||(p[t]="amdr-css-"+g++);d[i]||(a?m.push([i,t,n,r]):b.call(e,i,t,n,r))}})})(this,/*@cc_on!@*/!1);
