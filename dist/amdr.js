/*! AMDR 1.3.2 (sha1: a27a3e01a036b86963d1ec905a2b51d556e7d7b5) | (c) 2012~2016 Shen Junru. MIT License. | https://github.com/shenjunru/amdr */
!function(a,b,c){"use strict";function d(a){return"[object Function]"===U.call(a)}function e(a){return"[object String]"===U.call(a)}function f(a){return"[object Array]"===U.call(a)}function g(a,b,c){if(a&&d(b))for(var e in a)T.call(ra,e)||b.call(c,e,a[e])}function h(a,b){return!0===qa.debug&&qa.log(a,b),a}function i(a){return h(new Error(a.message),a)}function j(a,b){return i({message:"promise settled.",parent:a,source:b})}function k(a){return P.getElementsByTagName(a)[0]}function l(a,b,d){function e(){S(h.time),h.done=!0}var f,g=a.context.config.timeout,h={done:!1,time:c};a.pending=!1,isFinite(g)&&g>0&&(h.time=R(function(){o(a,h,f,i({message:"request timeout.",parent:b,source:a.name}))},1e3*g)),a.request.then(e,e),h.done||(f=_?m(a,h,b,d):n(a,h,b,d))}function m(b,d,e,f){na.push(b);try{a.importScripts(A(b.name,b.context.config,f)),o(b,d,c)}catch(g){o(b,d,c,i({message:"import failure.",parent:e,source:b.name}))}var h=na.pop();h&&h!==b&&na.push(h)}function n(a,b,c,d){var e=P.createElement("script");return la[a.name]=e,oa++,ga&&(ma[a.name]=[]),e[ca]=fa?function(){o(a,b,e)}:function(){ia[e.readyState]&&o(a,b,e)},e[da]=function(){o(a,b,e,i({message:"load failure.",parent:c,source:a.name}))},e.charset="utf-8",e.async=e.defer=!0,e.type="text/javascript",e.src=A(a.name,a.context.config,d),aa.appendChild(e)}function o(b,d,e,f){if(c!==e&&(e[da]=e[ca]="",d.done||delete la[b.name],d.done||oa--),f)d.done||b.reject(f);else{var g,h=ma;for(ga&&(h=h[b.name]);h.length;)g=h.shift(),g.push(b),I.apply(a,g);ga&&delete h[b.name],b.defined||I(b.name,[],[],qa.shimMap[b.name],b)}}function p(){this.pathMap={},this.shimMap={}}function q(a){var b=this,d=new v;b.resolve=d.resolve,b.reject=d.reject,b.promise=d.promise,b.config=a,b.rejected=!1,b.requires={},b.exports=c,b.module=c}function r(a,b){var d=this,e=new v,f=new v,g=b.clone();g.pathNow=a.replace(Aa,"$1"),d.define=e.resolve,d.settle=f.resolve,d.reject=function(a){var b=c;if(Ha===e.state()&&(b=e.reject(a)),Ha===f.state()&&(b=f.reject(a)),c===b)throw j("reject",a);return b},d.parents={},d.request=e.promise,d.promise=f.promise,d.context=new q(g),d.pending=!0,d.defined=!1,d.settled=!1,d.imports=c,d.insides=c,d.factory=c,d.exports=c,d.name=a}function s(a){this.then=a}function t(){var a,b,c=this,d=Ha,e=new X(function(c,d){a=c,b=d});c.promise=e,c.resolve=function(b){return a(b),e},c.reject=function(a){return b(a),e},c.state=function(){return d},c.then=function(){return e.then.apply(e,arguments)},e.then(function(){d=Ia},function(){d=Ja})}function u(){var a=this,b=[],d=new s(c),e=Ha,f=function(c,d){var e=a;return(c||d)&&(e=new v,b.push(function(a){a.then(c,d).then(e.resolve,e.reject)})),e.promise},g=function(a){var d,e;for(a=w(a),f=a.then,d=0,e=b.length;e>d;d++)b[d](a);return g=b=c,a};a.promise=d,a.then=d.then=function(a,b){return f(a,b)},a.resolve=function(a){if(g)return e=Ia,g(a);throw j("resolve",a)},a.reject=function(a){if(g)return e=Ja,g(y(a));throw j("reject",a)},a.state=function(){return e}}function v(a){var b=this;if(Y.call(b),d(a))try{a(b.resolve,b.reject)}catch(c){b.reject(c)}}function w(a){return d(a&&a.then)?a:x(a)}function x(a){return new s(function(b){try{return w(b?b(a):a)}catch(c){return y(c)}})}function y(a){return new s(function(b,c){try{return c?w(c(a)):y(a)}catch(d){return y(d)}})}function z(a,b){var d=C(a,b);if(Ba.test(d))return A(a,b,c);var e,f=d.split(Ba).shift(),g=f.split(Fa).pop(),h=g.lastIndexOf(".");return-1!==h&&(e=g.slice(h)),A(d,b,e)}function A(a,b,c){var d=a,e=null==c?b.urlExt:c;Ba.test(d)||0<d.split(Fa).pop().indexOf(e)||(d+=e),b.urlBase&&!xa.test(a)&&(d=b.urlBase+d);var f=d.split("#").shift(),g=d.slice(f.length);return b.urlArgs&&(f+=(Da.test(f)?"&":"?")+b.urlArgs),f+g}function B(a){do a=a.replace(za,Fa);while(a.indexOf("/./")>-1);for(var b,c=1,d=a.split(Fa);0<(b=V.call(d,"..",c));)Ea.test(d[b-=1])?c++:d.splice(b,2);return d.join(Fa)}function C(a,b){if(!a)return a;var c,d,e,f,g=a.split(Ba).shift(),h=a.slice(g.length);if(!g)return a;if(!xa.test(g)){if(ya.test(g))b.pathNow&&(g=b.pathNow+g);else if(c=b.pathMap){for(d=g.split(Fa),f=d.length;f>0;f--)if(e=d.slice(0,f).join(Fa),T.call(c,e)){(e=c[e])?d.splice(0,f,e):d.splice(0,f);break}g=d.join(Fa)}0===g.indexOf("./")&&(g=g.substring(2))}return B(g)+h}function D(){for(var a in la)if(ha===ia[la[a].readyState])return ka[a]}function E(a,b){function d(a,b,c){return c&&g.push(c),a}for(var e,f,g=[],h=0;-1<(h=V.call(a,Ga,h));)c===e&&(e=String(b).replace(va,""),f=e.replace(ua,"$1").replace(ta,"").split(sa)),e.replace(new RegExp(f[h]+wa,"g"),d),h++;return g}function F(a,b,c,d,f){function g(b){(e(b.index)?a.requires:m)[b.index]=b.exports,0===--k&&a.resolve(m)}function h(b){n=!1,a.reject(b)}var i,j,k,l,m=[],n=!0,o=b.length;if(c&&c.length&&(b=b.concat(c)),k=j=b.length)for(m.length=o,i=0;n&&j>i;i++)(l=b[i])&&G(a,o>i?i:l,l,d,f).then(g,h);else a.resolve(m);return a.promise}function G(a,b,c,d,e){function f(a){return{index:b,exports:a}}function g(b){if(!a.rejected)throw a.rejected=!0,b}var h=H(a,c,d,e);return h=h.then(function(a){return T.call(ja,c)?a:J(a,e)}),h.then(f,g)}function H(a,b,e,f){if(T.call(ja,b))return v.resolve(ja[b](a,e,f));var g,j,k,m=b.split("!").shift(),n=b.slice(m.length+1),o=m.split("#").shift(),p=m.slice(o.length);if(!o)return v.reject(i({message:(""===n?"module":"plugin")+" name empty.",parent:e,source:b}));if(""===n)g=!f&&d(qa.rewrite)?qa.rewrite(o,e):o,g=C(g,a.config),k=a.getModule(g).addParent(e),k.pending&&l(k,e,""===p?c:""),j=v.resolve(k);else{if(T.call(ja,o)||T.call(ja,n))return y(i({message:"pipe internal module.",parent:e,source:b}));j=H(a,o,Ga,!0),j=j.then(function(a){return T.call(ja,b)?a:J(a,!0)}),j=j.then(function(j){if(!j||!d(j.load))return y(i({message:'"load()" undefined.',parent:b,source:o}));if(g=d(j.normalize)?j.normalize(n,function(b){return C(b,a.config)}):C(n,a.config),k=a.getModule(m+"!"+g).addParent(e),!k.pending)return k;k.pending=!1;try{var l=!1,q=j.load({params:p,config:a.config,load:function(b){return l=!0,H(a,b||g,e,f).then(function(a){return a.request})},toUrl:function(b,c){return z(b,c||a.config)}},g,e,k.parents);v.resolve(q).then(function(a){if(l){var b=a.imports,e=a.insides;!f&&d(j.rewrite)&&(b=b&&W.call(b,function(a){return j.rewrite(a,k.name)}),e&&e&&W.call(e,function(a){return j.rewrite(a,k.name)})),I("",b,e,a.factory,k)}else I("",[],c,function(){return a},k)},k.reject)}catch(r){k.reject(h(r))}return k})}return j}function I(a,b,c,e,f){var g=f;if(a&&a!==g.name){var h=C(a,g.context.config);h&&h!==g.name&&(g=g.context.getModule(h))}return g.defined?void i({message:"duplicate defined.",parent:g.name,source:g.name}):(g.pending=!1,g.defined=!0,g.imports=b,g.insides=c,d(e)?g.factory=e:g.factory=function(){return e},void g.define({imports:g.imports,insides:g.insides,factory:g.factory}))}function J(b,d,e){function f(d){var e,f,g=b.context,i=g.exports,j=g.module;c!==j&&(j.factory=b.factory);try{f=b.factory.apply(a,d)}catch(k){b.reject(h(k))}e=j&&j.exports,c!==e&&i!==e?f=e:c===f&&c!==i&&(f=i),f=v.resolve(f),f.then(function(a){b.exports=a,c!==i&&(g.exports=a),c!==j&&(j.exports=a)}),f.then(b.settle,b.reject)}function g(a){b.reject(a)}return b.settled?b.promise:c===e?b.request.then(function(){return J(b,d,!0)}):(b.settled=!0,F(b.context,b.imports,b.insides,b.name,d).then(f,g),b.promise)}function K(a,b,g){var h=arguments.length;if(0!==h){var j,k,l,m,n,o,p=ga&&D();if(2===h){if(f(a))j=a;else{if(!e(a))throw new TypeError(a);n=a}l=b}else if(1===h)l=a;else{if(!e(n=a))throw new TypeError(n);if(!f(j=b))throw new TypeError(j);l=g}if(e(j)&&(j=j.split(sa)),f(j)&&(j=W.call(j,function(a){return a.replace(ta,"")})),d(l)?(m=l,m.length&&(c===j&&(j=Ka),k=E(j,l))):m=function(){return l},c===j&&(j=[]),o=n&&C(n,qa),ga&&p)return void ma[p.name].push([o,j,k,m]);if(!ga&&oa>0&&(!o||o in la))return void ma.push([o,j,k,m]);o||0===o||(_&&0<na.length?o=na[na.length-1].name:(o="unknown/"+ ++pa,i({message:"undetectable module name.",parent:"global",source:g||o}))),p=new q(qa).getModule(o),I(o,j,k,m,p)}}function L(b,c,g,h,i,j){var k,l=b,m=new q(h instanceof p?h:qa),n=e(i)?i:Ga,o=!1;if(e(b)&&(l=b.split(sa),o=2>l.length),!f(l))throw new TypeError(l);return l=W.call(l,function(a){return a.replace(ta,"")}),d(c)&&(k=E(l,c)),F(m,l,k,n,!0===j).then(function(b){return d(c)?c.apply(a,b):o?b[0]:b},function(b){if(d(g))return g.call(a,b);throw b})}function M(a,b,c){return function(e,f,g){if(e in a.requires){if(!d(f))return a.requires[e];f(a.requires[e])}else L(e,f,g,a.config,b,c)}}function N(a){return a.exports||(a.exports={})}function O(a){return a.module||(a.module={config:a.config,exports:N(a),factory:c,toUrl:function(b,c){return z(b,c||a.config)}})}var P=a.document,Q=a.console,R=a.setTimeout,S=a.clearTimeout,T=Object.prototype.hasOwnProperty,U=Object.prototype.toString,V=Array.prototype.indexOf||function(a,b){var c=this.length>>>0;for(b=b?0>b?Math.max(0,c+b):b:0;c>b;b++)if(b in this&&a===this[b])return b;return-1},W=Array.prototype.map||function(a){for(var b=0,d=this.length>>>0,e=new Array(d);d>b;b++)b in this&&(e[b]=a.call(c,this[b],b,this));return e},X=a.Promise,Y=X?t:u,Z=p.prototype,$=c===P||c===P.createElement,_=$&&d(a.importScripts),aa=$||k("head")||k("script"),ba=$?{}:P.createElement("script"),ca="onload",da="onerror",ea="readyState",fa=ca in ba||!(ea in ba),ga=!fa,ha={},ia={interactive:ha,loaded:1,complete:1},ja={},ka={},la={},ma=[],na=[],oa=0,pa=0,qa=new p,ra={},sa=/\s*,\s*/g,ta=/^\s+|\s+$/g,ua=/^\S+(?:\s*|\s+\S+\s*)\(([^)]*)\)[\s\S]+$/,va=/\/\*([\s\S]*?)\*\/|\/\/(.*)$/gm,wa=/\s*\((['"])([^'"(]+)\1\)/.source,xa=/^\/|^[^:]+:\/\//,ya=/^\.?\.\//,za=/\/\.\//g,Aa=/(\/?)[^\/]*$/,Ba=/[?#]/,Ca=/\/$/,Da=/\?/,Ea=/\.\.?/,Fa="/",Ga="require",Ha="pending",Ia="resolved",Ja="rejected",Ka=["require","exports","module"];ga&&(ca="onreadystatechange"),ga=_?!1:b||ga,ga&&(ma={}),Z.debug=!1,Z.timeout=7,Z.urlBase="",Z.urlArgs="",Z.urlExt=".js",Z.pathNow="",Z.pathMap=c,Z.shimMap=c,Z.rewrite=function(a,b){return a},Z.log=function(a,b){Q&&Function.prototype.call.call(Q.error||Q.log,Q,b||a.stack||a.stacktrace||a)},Z.clone=function(){var a=new p;return g(a,function(b,c){T.call(this,b)&&("pathMap"===b||"shimMap"===b?g(this[b],function(a,b){this[a]=b},c):a[b]=this[b])},this),a},Z.merge=function(b){if(!b)return this;var f=b.urlBase;return"debug"in b&&(this.debug=!0===b.debug),isFinite(b.timeout)&&0<b.timeout&&(this.timeout=b.timeout),e(f)&&(f&&!Ca.test(f)&&(f+="/"),this.urlBase=f),e(b.urlArgs)&&(this.urlArgs=b.urlArgs),e(b.urlExt)&&(this.urlExt=b.urlExt),d(b.rewrite)&&(this.rewrite=b.rewrite),g(b.pathMap,function(a,b){e(b)&&(this.pathMap[a]=B(b.replace(Ca,"")))},this),g(b.shimMap,function(b,f){var g=d(f)?f:e(f)?function(){return a[f]}:c;g&&(this.shimMap[C(b,this)]=g)},this),this},q.prototype.getModule=function(a){return ka[a]||(ka[a]=new r(a,this.config))},r.prototype.addParent=function(a){return Ga!==a&&T.call(ka,a)&&(this.parents[a]=ka[a].parents),this},v.resolve=X?X.resolve.bind(X):w,v.reject=X?X.reject.bind(X):y,K.amd={version:"1.3.2",cache:ka,jQuery:!0},L.config=function(a){return qa.merge(a).clone()},ja.require=M,ja.exports=N,ja.module=O,ja.isIE=function(){return b},ja.Deferred=function(){return v},a.amdr={define:a.define=K,require:a.require=L,version:"1.3.2"}}(this,/*@cc_on!@*/!1);