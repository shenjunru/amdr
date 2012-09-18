/*!
 * CSS file loader for AMDR
 * (c) 2012 Shen Junru. MIT License.
 * http://github.com/xfsn/amdr
 */
(function(e,t){"use strict";function h(e){return n.getElementsByTagName(e)[0]}function p(e,t){setTimeout(function(){e(t)})}function d(e,t,n){clearTimeout(l[e]),delete l[e],f[e]=1,t[u]=t[o]="",n||r.removeChild(t)}function v(e){for(e in l)return m()}function m(e,t,n,r,i){for(e in l){i=s,t=f[e];if(n=t.sheet){try{r=n.cssRules}catch(a){i=a.code===a.SECURITY_ERR}r?t[r.length?o:u]():i&&t[o]()}}setTimeout(v,100)}var n=e.document,r=h("head")||h("script"),i=t||"[object Opera]"==={}.toString.call(e.opera),s=!!e.devicePixelRatio,o=i?"onload":"ondone",u=i?"onerror":"onfail",a={},f={},l={},c=0;define({load:function(e,t,s){var h=a[e]||(a[e]="amdr-css-"+c++),m;f[h]||(f[h]=m=n.createElement("link"),m[o]=function(){d(h,m,!0),p(t,m)},m[u]=function(){d(h,m),p(s,new Error("load failures."))},l[h]=setTimeout(function(){d(h,m),p(s,new Error("load timeout."))},7e3),m.rel="stylesheet",m.type="text/css",m.id=h,m.href=e,r.appendChild(m),i||v())}})})(this,/*@cc_on!@*/!1);
 