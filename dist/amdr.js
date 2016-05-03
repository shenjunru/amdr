/*! AMDR 1.1.14 (sha1: 7475332e1b22bf1cb9947de311a3263058352386) | (c) 2012~2016 Shen Junru. MIT License. | https://github.com/shenjunru/amdr */
!function(a,b,c){"use strict";function d(a){return a instanceof Array}function e(a){return"function"==typeof a}function f(a){return"string"==typeof a}function g(a){return"object"==typeof a}function h(a,b){if(b){var c,e;for(c in b)vb.call(b,c)&&(e=b[c],d(e)?e=e.concat():g(e)&&(e=h(h({},a[c]),e)),a[c]=e)}return a}function i(a,b){P&&Function.prototype.call.call(P.error||P.log,P,b||a.stack||a.stacktrace||a)}function j(a,b){var c=new Error(a.message);return!0!==b&&fb.debug&&i(c,a),c}function k(){return j({message:"promise settled.",emitter:"deferred"},!0)}function l(a){return O.getElementsByTagName(a)[0]}function m(b,d,e){b.pending=!1;try{a.importScripts(e||A(b.name,b.context.config)),o(b,c)}catch(f){o(b,c,j({message:"import failure.",parent:d,source:b.name}))}}function n(a,b,c){if(R)return m(a,b,c);var d=O.createElement("script");a.pending=!1,cb[a.name]=d,db++,Y&&(bb[a.name]=[]),d[U]=X?function(){o(a,d)}:function(){$[d.readyState]&&o(a,d)},d[V]=function(){o(a,d,j({message:"load failure.",parent:b,source:a.name}))},d.charset="utf-8",d.async=d.defer=!0,d.type="text/javascript",d.src=c||A(a.name,a.context.config),S.appendChild(d)}function o(b,d,e){if(c!==d&&(d[V]=d[U]="",delete cb[b.name],db--),e)b.reject(e);else{var f,g=bb;for(Y&&(g=g[b.name]);g.length;)f=g.shift(),f.push(b),I.apply(a,f);Y&&delete g[b.name],b.defined||(b.defined=!0,b.resolve())}}function p(){}function q(a){var b=this;b.config={},b.urlBase="",b.urlArgs="",b.urlExt=".js",b.pathNow=a||"",b.pathMap={},b.timeout=7,b.debug=!1,b.override=!1}function r(a){var b=this,d=new u;b.resolve=d.resolve,b.reject=d.reject,b.promise=d.promise,b.config=a,b.rejected=!1,b.requires={},b.exports=c,b.module=c}function s(a,b){var d=this,e=new u;b=b.clone(),b.pathNow=a.replace(pb,"$1"),d.resolve=e.resolve,d.reject=e.reject,d.emitters={},d.promise=e.promise,d.context=new r(b),d.settled=!1,d.defined=!1,d.pending=!0,d.dependencies=c,d.factory=c,d.exports=c,d.name=a}function t(a){this.then=a}function u(){var a=this,b=new t,d=[],f=[],g="pending",h=function(b,c,g){var h=a;return(b||c)&&(h=new u,d.push(function(a){a.then(b,c).then(h.resolve,h.reject)})),e(g)&&f.push(g),h.promise},i=function(a){var b,e;for(a=v(a),h=a.then,b=0,e=d.length;e>b;b++)d[b](a);return i=d=c,a};a.promise=b,a.then=b.then=function(a,b,c){return h(a,b,c)},a.resolve=function(a){if(i)return g="resolved",i(a);throw k()},a.reject=function(a){if(i)return g="rejected",i(x(a));throw k()},a.notify=function(a){if(!i)throw k();for(var b=0,c=f.length;c>b;b++)f[b](a)},a.state=function(){return g}}function v(a){return e(a&&a.then)?a:w(a)}function w(a){return new t(function(b){try{return v(b?b(a):a)}catch(c){return x(c)}})}function x(a){return new t(function(b,c){try{return c?v(c(a)):x(a)}catch(d){return x(d)}})}function y(a,b,c,d){return v(a).then(b,c,d)}function z(a,b){var c=a.lastIndexOf("."),d="";return-1!==c&&(d=a.substring(c,a.length),a=a.substring(0,c)),a=C(a,b),A(a,b,d)}function A(a,b,c){var d=a;return nb.test(d)||(d+=c||b.urlExt),b.urlBase&&!lb.test(a)&&(d=b.urlBase+d),b.urlArgs&&(d+=(rb.test(d)?"&":"?")+b.urlArgs),d}function B(a){do a=a.replace(ob,tb);while(a.indexOf("/./")>-1);for(var b,c=1,d=a.split(tb);0<(b=wb.call(d,"..",c));)sb.test(d[b-=1])?c++:d.splice(b,2);return d.join(tb)}function C(a,b){if(!a)return a;if(!lb.test(a)){if(mb.test(a))b.pathNow&&(a=b.pathNow+a);else{var c,d,e,f=b.pathMap;if(f){for(c=a.split(tb),e=c.length;e>0;e--)if(d=c.slice(0,e).join(tb),vb.call(f,d)){(d=f[d])?c.splice(0,e,d):c.splice(0,e);break}a=c.join(tb)}}0===a.indexOf("./")&&(a=a.substring(2))}return B(a)}function D(a,b){var c,d=a?a.indexOf("!"):-1;return-1!==d&&(c=a.substring(d+1,a.length),a=a.substring(0,d)),{name:C(a,b),pipe:c}}function E(){for(var a in cb)if(Z===$[cb[a].readyState])return ab[a]}function F(a,b){function d(a,b,c){return c&&g.push(c),a}for(var e,f,g=[],h=0;-1<(h=wb.call(a,"require",h));)c===e&&(e=String(b).replace(jb,""),f=e.replace(ib,"$1").replace(hb,"").split(gb)),e.replace(new RegExp(f[h]+kb,"g"),d),h++;return g}function G(a,b,d,e){function f(a){return{index:d,exports:a}}function g(b){if(!a.rejected)throw a.rejected=!0,b}if(b in _)return w(_[b](a)).then(f);var h,i,k,l=isNaN(d)&&d,m=D(b,a.config),o=m.name,p=m.pipe;return o?(h=a.getModule(!l||p?o:l.name+"!"+o),h.addEmitter(e),i=h.promise,c!==p&&(k=new u,i.then(function(c){c&&c.load?(p=c.normalize?c.normalize(p,function(b){return C(b,a.config)}):C(p,a.config),G(a,p,h,e).then(k.resolve,k.reject)):k.reject(j({message:'"load()" undefined.',parent:e,source:b}))},k.reject),i=k.promise),l?(h.pending&&(h.pending=!1,l.exports.load(o,{emitters:h.emitters,resolve:h.resolve,reject:h.reject,config:function(){return h.context.config},load:function(a){n(h,e,a)},toUrl:function(a,b){return z(a,b||this.config())}}),h.promise.then(function(a){h.exports=a,h.defined=!0,h.settled=!0})),i):(h.pending&&n(h,e),i.then(f,g))):x(j({message:"module name empty.",parent:e,source:b})).then(g)}function H(a,b,c,d){function e(b){(f(b.index)?a.requires:n)[b.index]=b.exports,0!==--l||q||(q=!0,a.resolve(n))}function g(b){o=!1,q||(q=!0,a.reject(b))}function h(){q||(q=!0,a.reject(j({message:"execute timeout.",parent:d,source:"context"})))}var i,k,l,m,n=[],o=!0,p=b.length,q=!1;if(c&&c.length&&(b=b.concat(c)),l=k=b.length){for(n.length=p,i=0;o&&k>i;i++)(m=b[i])&&G(a,m,p>i?i:m,d).then(e,g);setTimeout(h,1e3*a.config.timeout)}else a.resolve(n);return a.promise}function I(b,d,e,f,g){function h(b){var d,e,h=l.module,j=l.exports;c!==h&&(h.factory=f);try{e=f.apply(a,b)}catch(k){i(k),g.reject(k)}d=h&&h.exports,c!==d&&j!==d?e=d:c===e&&j&&(e=j),g.exports=e,c!==h&&(l.module.exports=e),c!==j&&(l.exports=e),g.settled=!0,g.resolve(e)}function k(a){g.reject(a)}var l=g.context;return b=C(b,l.config),b&&b!==g.name&&(g=l.getModule(b),l=g.context),g.defined&&!fb.override?void j({message:"duplicate defined.",parent:g.name,source:g.name}):(g.defined=!0,g.pending=!1,g.dependencies=d,g.factory=f,void H(l,d,e,g.name).then(h,k))}function J(b,c,g){var h,i,k,l=arguments.length,m=Y&&E(),n=ub;2===l?(f(b)?h=b:n=b,g=c):1===l?g=b:3===l&&(h=b,n=c),e(g)?(ub!==n||g.length||(n=""),n=n&&(""+n).replace(hb,""),n=n?n.split(gb):[],i=g,i.length&&(k=F(n,i))):(ub===n&&(n=[]),i=function(){return g}),h=h&&C(h,fb),m?bb[m.name].push([h,n,k,i]):db>0&&d(bb)&&(!h||h in cb)?bb.push([h,n,k,i]):(h||0===h||(h="unknown/"+ ++eb,j({message:"undetectable module name.",parent:a,source:g||h})),I(h,n,k,i,new r(fb).getModule(h)))}function K(b,d,f,g){b=String(b).replace(hb,"").split(gb),g=new r(g?g.config:fb);var h;return e(d)?h=F(b,d):d=c,H(g,b,h,"require").then(function(b){return d&&d.apply(a,b)},function(b){throw e(f)&&f.call(a,b),b})}function L(a){return function(b,c,d){if(b in a.requires){if(!e(c))return a.requires[b];c(a.requires[b])}else K(b,c,d,a)}}function M(a){return a.exports||(a.exports={})}function N(a){return a.module||(a.module={factory:c,exports:M(a),config:function(){return a.config.config},toUrl:function(b,c){return z(b,c||a.config)}})}var O=a.document,P=a.console,Q=c===O||c===O.createElement,R=Q&&e(a.importScripts),S=Q||l("head")||l("script"),T=Q?{}:O.createElement("script"),U="onload",V="onerror",W="readyState",X=U in T||!(W in T),Y=!X,Z={},$={interactive:Z,loaded:1,complete:1},_={},ab={},bb=Y?{}:[],cb={},db=0,eb=0,fb=new q,gb=/\s*,\s*/g,hb=/^\s+|\s+$/g,ib=/^\S+(?:\s*|\s+\S+\s*)\(([^\)]*)\)[\s\S]+$/,jb=/\/\*([\s\S]*?)\*\/|\/\/(.*)$/gm,kb=/\s*\((['"])([^'"\(]+)\1\)/.source,lb=/^\/|^[^:]+:\/\//,mb=/^\.?\.\//,nb=/\?|\.js$/,ob=/\/\.\//g,pb=/(\/?)[^\/]*$/,qb=/\/$/,rb=/\?/,sb=/\.\.?/,tb="/",ub="require,exports,module",vb=Object.prototype.hasOwnProperty,wb=Array.prototype.indexOf||function(a,b){var c=this.length;for(b=b?0>b?Math.max(0,c+b):b:0;c>b;b++)if(b in this&&a===this[b])return b;return-1};Y&&(U="onreadystatechange"),Y=b||Y,(p.prototype=q.prototype).clone=function(){var a=new p;return h(a,this),a},r.prototype.getModule=function(a){return ab[a]||(ab[a]=new s(a,this.config))},s.prototype.addEmitter=function(a){null!=a&&"require"!==a&&(this.emitters[a]=ab[a].emitters)},t.prototype.always=function(a){return this.then(a,a)},J.amd={version:"1.1.14",cache:ab,jQuery:!0},K.config=function(a){if(a){var b,c=a.urlBase,d=a.pathMap;if(c&&!qb.test(c)&&(a.urlBase+="/"),d)for(b in d)d[b]=B(d[b].replace(qb,""));h(fb,a)}return fb},_.require=L,_.exports=M,_.module=N,_.isIE=function(){return b},_.Promise=function(){return t},_.Deferred=function(){return u},t.resolve=v,t.resolved=w,t.rejected=x,t.when=y,a.define=J,a.require=K}(this,/*@cc_on!@*/!1);