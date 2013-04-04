/*! AMDR 1.1.3 (sha1: 3112c090786e6f46f00a4e8edb0409580b8532db) | (c) 2012~2013 Shen Junru. MIT License. | http://github.com/shenjunru/amdr */
(function(e,t,n){"use strict";function F(e){return e instanceof Array}function I(e){return"function"==typeof e}function q(e){return"string"==typeof e}function R(e){return"object"==typeof e}function U(e,t){if(t){var n,r;for(n in t)B.call(t,n)&&(r=t[n],F(r)?r=r.concat():R(r)&&(r=U(U({},e[n]),r)),e[n]=r)}return e}function z(e,t){i&&Function.prototype.call.call(i.error||i.log,i,t||e.stack||e.stacktrace||e)}function W(e,t){var n=new Error(e.message);return!0!==t&&w.debug&&z(n,e),n}function X(){return W({message:"promise fulfilled.",emitter:"deferred"},!0)}function V(e){return r.getElementsByTagName(e)[0]}function $(t,r,i){t.padding=!1;try{e.importScripts(i||ut(t.name,t.context.config)),K(t,n)}catch(s){K(t,n,W({message:"import failure.",parent:r,source:t.name}))}}function J(e,t,n){if(o)return $(e,t,n);var i=r.createElement("script");e.padding=!1,m[e.name]=i,p&&(b[e.name]=[]),i[f]=h?function(){K(e,i)}:function(){v[i.readyState]&&K(e,i)},i[l]=function(){K(e,i,W({message:"load failure.",parent:t,source:e.name}))},i.charset="utf-8",i.async=i.defer=!0,i.type="text/javascript",i.src=n||ut(e.name,e.context.config),u.appendChild(i)}function K(t,r,i){n!==r&&(r[l]=r[f]="",delete m[t.name]);if(i)t.reject(i);else{var s,o=b;p&&(o=o[t.name]);while(o.length)s=o.shift(),s.push(t),vt.apply(e,s);p&&delete o[t.name],t.defined||(t.defined=!0,t.resolve())}}function Q(){}function G(e){var t=this;t.config={},t.urlBase="",t.urlArgs="",t.urlExt=".js",t.pathNow=e||"",t.pathMap={},t.timeout=7,t.debug=!1}function Y(e){var t=this,r=new tt;t.resolve=r.resolve,t.reject=r.reject,t.promise=r.promise,t.config=e,t.rejected=!1,t.requires={},t.exports=n,t.module=n}function Z(e,t){var n=this,r=new tt;t=t.clone(),t.pathNow=e.replace(O,"$1"),n.resolve=r.resolve,n.reject=r.reject,n.promise=r.promise,n.context=new Y(t),n.defined=!1,n.padding=!0,n.name=e}function et(e){this.then=e}function tt(){var e=this,t=new et,r=[],i=[],s="pending",o=function(t,n,s){var o=e;if(t||n)o=new tt,r.push(function(e){e.then(t,n).then(o.resolve,o.reject)});return I(s)&&i.push(s),o.promise},u=function(e){var t,i;e=nt(e),o=e.then;for(t=0,i=r.length;t<i;t++)r[t](e);return u=r=n,e};e.promise=t,e.then=t.then=function(e,t,n){return o(e,t,n)},e.resolve=function(e){if(u)return s="resolved",u(e);throw X()},e.reject=function(e){if(u)return s="rejected",u(it(e));throw X()},e.notify=function(e){if(!u)throw X();for(var t=0,n=i.length;t<n;t++)i[t](e)},e.state=function(){return s}}function nt(e){return e instanceof et?e:rt(e)}function rt(e){return new et(function(t){try{return nt(t?t(e):e)}catch(n){return it(n)}})}function it(e){return new et(function(t,n){try{return n?nt(n(e)):it(e)}catch(r){return it(r)}})}function st(e,t,n,r){return nt(e).then(t,n,r)}function ot(e,t){var n=e.lastIndexOf("."),r="";return-1!==n&&(r=e.substring(n,e.length),e=e.substring(0,n)),e=ft(e,t),ut(e,t,r)}function ut(e,t,n){var r=e;return L.test(r)||(r+=n||t.urlExt),t.urlBase&&!C.test(e)&&(r=t.urlBase+r),t.urlArgs&&(r+=(_.test(r)?"&":"?")+t.urlArgs),r}function at(e){do e=e.replace(A,P);while(e.indexOf("/./")>-1);var t,n=1,r=e.split(P);while(0<(t=j.call(r,"..",n)))D.test(r[t-=1])?n++:r.splice(t,2);return r.join(P)}function ft(e,t){if(!e)return e;if(!C.test(e)){if(!k.test(e)){var n=t.pathMap,r,i,s;if(n){r=e.split(P);for(s=r.length;s>0;s--){i=r.slice(0,s).join(P);if(B.call(n,i)){(i=n[i])?r.splice(0,s,i):r.splice(0,s);break}}e=r.join(P)}}else t.pathNow&&(e=t.pathNow+e);0===e.indexOf("./")&&(e=e.substring(2))}return at(e)}function lt(e,t){var n=e?e.indexOf("!"):-1,r;return-1!==n&&(r=e.substring(n+1,e.length),e=e.substring(0,n)),{name:ft(e,t),pipe:r}}function ct(e){for(e in m)if(d===v[m[e].readyState])return y[e]}function ht(e,t){function u(e,t,n){return n&&r.push(n),e}var r=[],i=0,s,o;while(-1<(i=j.call(e,"require",i)))n===s&&(s=String(t).replace(T,""),o=s.replace(x,"$1").replace(S,"").split(E)),s.replace(new RegExp(o[i]+N,"g"),u),i++;return r}function pt(e,t,r,i){function h(e){return{index:r,exports:e}}function p(t){if(!e.rejected)throw e.rejected=!0,t}if(t in g)return rt(g[t](e)).then(h);var s=isNaN(r)&&r,o=lt(t,e.config),u=o.name,a=o.pipe,f,l,c;return u?(f=e.getModule(u),l=f.promise,n!==a&&(c=new tt,l.then(function(n){n&&n.load?(n.normalize?a=n.normalize(a,function(t){return ft(t,e.config)}):a=ft(a,e.config),pt(e,a,n,i).then(c.resolve,c.reject)):c.reject(W({message:'"load()" undefined.',parent:i,source:t}))},c.reject),l=c.promise),s?(f.padding&&(f.padding=!1,s.load(u,{resolve:f.resolve,reject:f.reject,config:function(){return f.context.config},load:function(e){J(f,i,e)},toUrl:function(e,t){return ot(e,t||this.config())}})),l):(f.padding&&J(f,i),l.then(h,p))):it(W({message:"module name empty.",parent:i,source:t})).then(p)}function dt(e,t,n,r){function h(t){(q(t.index)?e.requires:i)[t.index]=t.exports,0===--l&&!u&&(u=!0,e.resolve(i))}function p(t){s=!1,u||(u=!0,e.reject(t))}function d(){u||(u=!0,e.reject(W({message:"execute timeout.",parent:r,source:"context"})))}var i=[],s=!0,o=t.length,u=!1,a,f,l,c;n&&n.length&&(t=t.concat(n));if(l=f=t.length){i.length=o;for(a=0;s&&a<f;a++)(c=t[a])&&pt(e,c,a<o?a:c,r).then(h,p);setTimeout(d,1e3*e.config.timeout)}else e.resolve(i);return e.promise}function vt(t,r,i,s,o){function a(t){var r=u.exports,i=u.module,a;try{a=s.apply(e,t)}catch(f){z(f),o.reject(f)}i=i&&i.exports,n!==i&&r!==i?a=i:n===a&&r&&(a=r),o.resolve(a)}function f(e){o.reject(e)}var u=o.context;t=ft(t,u.config),t&&t!==o.name&&(o=u.getModule(t),u=o.context);if(o.defined)return;o.defined=!0,o.padding=!1,dt(u,r,i,o.name).then(a,f)}function mt(e,t,n){var r=arguments.length,i=H,s,o,u,a;2===r?(q(e)?o=e:i=e,n=t):1===r?n=e:3===r&&(o=e,i=t),I(n)?(H===i&&!n.length&&(i=""),i=i&&String(i).replace(S,""),i=i?i.split(E):[],u=n,u.length&&(s=ht(i,u))):(i=[],u=function(){return n}),p?(a=ct(),b[a.name].push([o,i,s,u])):b.push([o,i,s,u])}function gt(t,r,i,s){t=String(t).replace(S,"").split(E);var s=s||new Y(w),o;return I(r)?o=ht(t,r):r=n,dt(s,t,o,"require").then(function(t){return r&&r.apply(e,t)},function(t){throw I(i)&&i.call(e,t),t})}function yt(e){return function(t,n,r){if(t in e.requires){if(!I(n))return e.requires[t];n(e.requires[t])}else gt(t,n,r,e)}}function bt(e){return e.exports||(e.exports={})}function wt(e){return e.module||(e.module={exports:bt(e),config:function(){return e.config.config},toUrl:function(t,n){return ot(t,n||e.config)}})}var r=e.document,i=e.console,s=n===r||n===r.createElement,o=s&&I(e.importScripts),u=s||V("head")||V("script"),a=s?{}:r.createElement("script"),f="onload",l="onerror",c="readyState",h=f in a||!(c in a),p=!h,d={},v={interactive:d,loaded:1,complete:1},m={},g={},y={},b=p?{}:[],w=new G,E=/\s*,\s*/g,S=/^\s+|\s+$/g,x=/^\S+(?:\s*|\s+\S+\s*)\(([^\)]*)\)[\s\S]+$/,T=/\/\*([\s\S]*?)\*\/|\/\/(.*)$/mg,N=/\s*\((['"])([^'"\(]+)\1\)/.source,C=/^\/|^[^:]+:\/\//,k=/^\.?\.\//,L=/\?|\.js$/,A=/\/\.\//g,O=/(\/?)[^\/]*$/,M=/\/$/,_=/\?/,D=/\.\.?/,P="/",H="require,exports,module",B=Object.prototype.hasOwnProperty,j=Array.prototype.indexOf||function(e,t){var n=this.length;t=t?t<0?Math.max(0,n+t):t:0;for(;t<n;t++)if(t in this&&e===this[t])return t;return-1};p&&(f="onreadystatechange"),p=t||p,(Q.prototype=G.prototype).clone=function(){var e=new Q;return U(e,this),e},Y.prototype.getModule=function(e){return y[e]||(y[e]=new Z(e,this.config))},et.prototype.always=function(e){return this.then(e,e)},mt.amd={version:"%VERSION%",jQuery:!0},gt.config=function(e){if(e){var t=e.urlBase,n=e.pathMap,r;t&&!M.test(t)&&(e.urlBase+="/");if(n)for(r in n)n[r]=at(n[r].replace(M,""));U(w,e)}return w},g.require=yt,g.exports=bt,g.module=wt,g.isIE=function(){return t},g.Promise=function(){return et},g.Deferred=function(){return tt},et.resolve=nt,et.resolved=rt,et.rejected=it,et.when=st,e.define=mt,e.require=gt})(this,/*@cc_on!@*/!1);
