/*! AMDR - CSS file loader 1.0.1 (sha1: 59b96c1968fce58e1041eb6958e64dd83e1d79e7) | (c) 2012~2016 Shen Junru. MIT License. | https://github.com/shenjunru/amdr */
!function(a,b,c){"use strict";function d(a,b,c){var d=y[a]=g(b);d.id=a,d[v]=function(){!t||k(d)?(e(a,d,!0),j(c.resolve,d)):d[w]()},d[w]=function(){e(a,d),j(c.reject,new Error("load failures."))},z[a]=setTimeout(function(){e(a,d),j(c.reject,new Error("load timeout."))},q?3e3:1e3*c.config().timeout),o.appendChild(d),r||B||u&&t||l()}function e(a,b,c){clearTimeout(z[a]),delete z[a],y[a]=1,b[w]=b[v]="",c||o.removeChild(b)}function f(a){return n.getElementsByTagName(a)[0]}function g(a){var b=n.createElement("link");return b.rel="stylesheet",b.type="text/css",b.href=a,b}function h(a,b,c){var d=g(b),e=!1,f=2;d[a]=function(){e=!0},o.appendChild(d),function h(){e?(c(!0),o.removeChild(d)):f--?setTimeout(h,0):(c(!1),o.removeChild(d))}()}function i(){for(s=!1;A.length;)d.apply(a,A.shift())}function j(a,b){setTimeout(function(){a(b)},0)}function k(a){try{var a=a.sheet||a.styleSheet,c=a.rules||a.cssRules;return!c||0<c.length}catch(d){return!b&&m(d)}}function l(a,b,c,d,e){for(a in z)if(e=p,b=y[a],c=b.sheet){try{d=c.cssRules}catch(f){e=m(f)}d?b[d.length?v:w]():e&&b[v]()}B=a?setTimeout(l,100):0}function m(a){return q||a.code===(a.SECURITY_ERR||1e3)}var n=a.document,o=f("head")||f("script"),p="webkitAppearance"in n.documentElement.style,q="[object Opera]"==={}.toString.call(a.opera),r=b||q,s=!r,t=r||c,u=r?!1:c,v="onload",w="onerror",x={},y={},z={},A=[],B=0,C=0;r||h(v,"data:text/css;base64,",function(a){t=a,c!==u&&i()}),r||h(w,p?"data:":"data:,",function(a){u=a,c!==v&&i()}),define(["exports"],function(b){return b.load=function(b,c){var e=x[b]||(x[b]="amdr-css-"+C++);y[e]||(s?A.push([e,b,c]):d.call(a,e,b,c))},b})}(this,/*@cc_on!@*/!1);