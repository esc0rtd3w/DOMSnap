/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var SnapCache = __webpack_require__(3);
	var Watcher = __webpack_require__(4);
	var DB = __webpack_require__(2);

	var DS,
	  CONFIG,
	  capId = 'DEFAULT_CAPTURE_ID',
	  oSnapCache = new SnapCache(),
	  oWatcher = new Watcher(),
	  snapDB,
	  inited;

	CONFIG = {
	  scope: 'path',
	  version: 1
	};


	function _id(id){
	  return Util.isNil(id)? capId: id;
	}

	function _str(val){
	  return Util.isFunction(val)? val.apply(this,[].slice.call(arguments, 1)): val;
	}

	function _scope(val){
	  var location = window.location,
	    host = location.host,
	    path = host+location.pathname;
	  if(/^host$/ig.test(val)){
	    return host;
	  }
	  else if(/^path$/ig.test(val) || Util.isNil(val)){
	    return path;
	  }else{
	    return val;
	  }
	}

	/**
	 *
	 * DOMSnap(config)
	 * Initialize DOMSnap
	 *
	 * @constructor
	 * @param {object} config - [optional]
	 * @param {function} config.onReady  - will be called when DOMSnap is ready
	 * @param {number} config.version  - Version control, Nonzero. Update is required if web app has been updated. Default is 1
	 * @param {string} config.scope  - "host|path|or any string value". "host": location.host; "path": location.host+location.pathname; default is "path"
	 * @returns {object} {{capture: capture, resume: resume, get: get, getAll: getAll, remove: remove, clear: clear}|*}
	 * @example
	 * //init DOMSnap
	 * var DS = DOMSnap({
	 *   onReady: function(){
	 *     console.log('DOMSnap is ready');
	 *   }
	 * });
	 *
	 * //capture snapshot html of #main
	 * DS.capture('#main');
	 * //capture with specified capture id
	 * DS.capture('#main', {id: 'my_id'});
	 *
	 * //set the html of #main by it's captured snapshot html
	 * DS.resume('#main');
	 * //set by specified capture id
	 * DS.resume('#main',{id: 'my_id'});
	 */
	function DOMSnap(config) {
	  if(inited){return DS;}
	  inited = true;

	  Util.apply(CONFIG,config);
	  snapDB = new DB(CONFIG.DBName,function(){
	    snapDB.getAll(_scope(CONFIG.scope), CONFIG.version, function(rows){
	      rows.forEach(function (key) {
	        oSnapCache.set(key.selector, key.capture_id, key.htm);
	      });
	      CONFIG.onReady && CONFIG.onReady(DS);
	    });
	  });
	  return DS;
	}

	/**
	 *
	 * .capture(selector, options)
	 * capture snapshot html of the element matches the selector and store the result with a capture id
	 *
	 * @function
	 * @param {string} selector - selector of the element
	 * @param {object} options - [optional]
	 * @param {string|function} options.id - capture id, if html is not null set id to null to store html as the default snapshot
	 * @param {string|function} options.html - snapshot html, set id to null to store html as the default snapshot
	 * @returns {DOMSnap}
	 */
	function capture(selector, options) {
	  options = options || {};
	  var id,html;
	  id = Util.isNil(options.id)?_id(options.id):_str(options.id, selector);
	  html = Util.isNil(options.html)?Util.html(selector):_str(options.html, selector);
	  oSnapCache.set(selector, id, html);
	  snapDB.add(selector, id, html, _scope(CONFIG.scope), CONFIG.version);
	  return DS;
	}

	/**
	 *
	 * .resume(selector, options)
	 * set the html of the element matches the selector [and capture id] by it's captured snapshot html
	 *
	 * @function
	 * @param {string} selector - selector of the element
	 * @param {object} options - [optional]
	 * @param {string|function} options.id - capture id, if html is not null set id to null to store html as the default snapshot
	 * @param {function} options.fallback - a callback function, will be called if no snapshot matched
	 * @returns {DOMSnap}
	 */
	function resume(selector, options) {
	  options = options || {};
	  var id, html;
	  id = Util.isNil(options.id)?_id(options.id):_str(options.id, selector);
	  html = get(selector, id);
	  Util.html(selector, html);
	  options.fallback && Util.isNil(html) && options.fallback();
	  return DS;
	}

	/**
	 * .watch(selector, options)
	 * watch and auto capture the element matches the selector
	 * @param {string|array} selector - selector[s] of the element[s]
	 * @param {object} options - [optional]
	 * @param {string|function} options.id - capture id
	 * @param {string|function} options.html - snapshot html
	 * @example
	 * //e.g.1
	 * DS.watch('#main');
	 *
	 * //e.g.2
	 * DS.watch('#main',{
	 *   id: 'my_capture_id',//capture id
	 *   html: 'my_snapshot_html'//snapshot html
	 * });
	 *
	 * //e.g.3
	 * DS.watch('#main',{
	 *   id: function(selector){ return 'generated_capture_id_for_'+selector;}, //return capture id
	 *   html: function(selector){ return 'generated_snapshot_html_for_'+selector;} //return snapshot html
	 * });
	 *
	 * //e.g.4
	 * DS.watch(['#main', '#another']);//watch multi elements
	 * @returns {DOMSnap}
	 */
	function watch(selector, options) {
	  options = options || {};
	  var selectors = Util.isArray(selector)?selector:[selector];
	  selectors.forEach(function(key){
	    oWatcher.watch(key,function(){
	      capture(key, {
	        id: options.id,
	        html: options.html
	      });
	    });
	  });

	  return DS;
	}

	/**
	 * .get(selector, id)
	 * retrun the captured snapshot html of the element matches the selector and capture id
	 *
	 * @function
	 * @param {string} selector - selector of the element
	 * @param {string} id - [optional]capture id, the result be the default snapshot if it's not specified
	 * @returns {string} html
	 */
	function get(selector, id) {
	  return oSnapCache.get(selector, id);
	}

	/**
	 *
	 * .getAll(selector)
	 * retrun all the captured snapshots html of the element matches the selector
	 *
	 * @function
	 * @param {string} selector - selector of the element
	 * @returns {object} all snapshots as object - e.g. {DEFAULT_CAPTURE_ID: 'html of DEFAULT_CAPTURE', my_id: 'html of my_id'}
	 */
	function getAll(selector) {
	  return oSnapCache.get(selector);
	}

	/**
	 *
	 * .remove(selector, id)
	 * remove the captured snapshot html of the element matches the selector [and capture id]
	 *
	 * @function
	 * @param {string} selector - selector of the element
	 * @param {string} id - [optional]capture id, will empty all snapshots if it's not specified
	 * @returns {DOMSnap}
	 */
	function remove(selector, id) {
	  oSnapCache.del(selector, id);
	  snapDB.delete(selector, id, _scope(CONFIG.scope), CONFIG.version);
	  return DS;
	}

	/**
	 *
	 * .clear(version)
	 * clear all captured snapshots
	 *
	 * @function
	 * @param {number} version - [optional]Same value as initialize DOMSnap if it's not specified.
	 * @returns {DOMSnap}
	 */
	function clear(version) {
	  if(Util.isNil(version) || version == CONFIG.version){
	    oSnapCache.empty();
	  }
	  snapDB.deleteAll(_scope(CONFIG.scope), version || CONFIG.version);
	  return DS;
	}

	DS =  {
	  capture: capture,
	  resume: resume,
	  watch: watch,
	  get: get,
	  getAll: getAll,
	  remove: remove,
	  clear: clear
	};

	window.DOMSnap = DOMSnap;
	module.exports = DOMSnap;


/***/ },
/* 1 */
/***/ function(module, exports) {

	var ua = navigator.userAgent,
	  android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
	  ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
	  ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
	  iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
	  os = {};

	if (android) os.android = true, os.version = android[2];
	if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
	if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
	if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;

	function isNil(val) {
	  return val==undefined || val == null || val==false;
	}

	function isFunction(val) {
	  return typeof val=='function';
	}

	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}

	function apply(obj, config, promise) {
	  var conf = isFunction(config)?config.call(obj):config;
	  if (conf) {
	    var attr;
	    for (attr in conf) {
	      obj[attr] = promise ? promise(conf[attr]) : conf[attr];
	    }
	  }
	}

	function el(selector){
	  return document.querySelector(selector);
	}

	function html(selector, htm){
	  var ele = el(selector);
	  return isNil(htm)?ele.innerHTML:(ele.innerHTML = htm);
	}

	exports.os = os;
	exports.isNil = isNil;
	exports.isFunction = isFunction;
	exports.isArray = isArray;
	exports.apply = apply;
	exports.el = el;
	exports.html = html;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var lovefield = __webpack_require__(5);
	var lf = lf || lovefield;

	module.exports = function (name,callback){
	  var schemaBuilder = lf.schema.create(name||'DOMSnap_DB', 5),
	    DB,Table;

	  schemaBuilder
	    .createTable('Snap')
	    .addColumn('id', lf.Type.INTEGER)
	    .addColumn('selector', lf.Type.STRING)
	    .addColumn('capture_id', lf.Type.STRING)
	    .addColumn('htm', lf.Type.OBJECT)
	    .addColumn('scope', lf.Type.STRING)
	    .addColumn('version', lf.Type.INTEGER)
	    .addColumn('create', lf.Type.DATE_TIME)
	    .addPrimaryKey(['id'], true);

	  schemaBuilder.connect({
	    storeType: Util.os.ios?lf.schema.DataStoreType.WEB_SQL: null
	  }).then(function (db) {
	    DB = db;
	    Table = DB.getSchema().table('Snap');
	    callback && callback();
	  });

	  this.add = function (selector, capture_id, htm, scope, version) {
	    !Util.isNil(selector) && !Util.isNil(capture_id) && this.delete(selector, capture_id, scope, version, function(){
	      var row = Table.createRow({
	        'selector': selector,
	        'capture_id': capture_id,
	        'htm': htm,
	        'scope': scope,
	        'version': version,
	        'create': new Date()
	      });
	      DB.insertOrReplace().into(Table).values([row])
	        .exec();
	    });
	  }

	  this.delete = function (selector, capture_id, scope, version, callback) {
	    DB.delete()
	      .from(Table)
	      .where(lf.op.and(
	        Table.selector.eq(selector),
	        Table.capture_id.eq(capture_id),
	        Table.scope.eq(scope),
	        Table.version.eq(version)
	      ))
	      .exec().then(function () {
	        callback && callback();
	      });
	  }

	  this.getAll = function (scope, version, callback) {
	    DB.select()
	      .from(Table)
	      .where(lf.op.and(
	        Table.scope.eq(scope),
	        Table.version.eq(version)
	      ))
	      .orderBy(Table.id, lf.Order.DESC)
	      .exec().then(function (rows) {
	        callback && callback(rows);
	      });
	  }

	  this.deleteAll = function (scope, version) {
	    DB.delete()
	      .from(Table)
	      .where(lf.op.and(
	        Table.scope.eq(scope),
	        Table.version.eq(version)
	      ))
	      .exec();
	  }
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);

	function SnapCache() {
	  var cache = {};

	  this.get = function (id,childId) {
	    return cache[id]
	      ?(Util.isNil(childId)
	        ?cache[id]
	        :cache[id][childId])
	      :null;
	  }

	  this.set = function(id,childId,body){
	    if(!Util.isNil(id) && !Util.isNil(childId) && !Util.isNil(body)){
	      cache[id] = cache[id] || {};
	      cache[id][childId] = body;
	    }
	  }

	  this.del = function (id,childId) {
	    if(cache[id]){
	      if(Util.isNil(childId)){
	        cache[id] = null;
	        delete cache[id];
	      }else{
	        cache[id][childId] = null;
	        delete cache[id][childId];
	      }
	    }
	  }

	  this.empty = function() {
	    cache = {};
	  }
	}
	module.exports = SnapCache;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var Util = __webpack_require__(1);
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

	function Watcher() {
	  var observes = {};

	  function add(id,observer){
	    del(id);
	    observes[id] = observer;
	  }

	  function del(id) {
	    var observer = observes[id];
	    if(observer){
	      observer.disconnect();
	      observes[id] = null;
	      delete observes[id];
	    }
	  }

	  function genObserver(selector, mutationCallback){
	    return new MutationObserver(mutationCallback)
	      .observe(Util.el(selector), {
	        attributes: true,
	        childList: true,
	        characterData: true,
	        subtree: true
	      });
	  }

	  this.watch = function (selector, mutationCallback) {
	    add(selector, genObserver(selector, mutationCallback));
	  }

	  this.unwatch = function (selector) {
	    del(selector);
	  }
	}
	module.exports = Watcher;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {if(!self.window){window=self;}
	(function(){'use strict';function aa(){return function(){}}function ba(a){return function(b){this[a]=b}}function g(a){return function(){return this[a]}}function l(a){return function(){return a}}var m,ca=this;function p(a){return void 0!==a}function da(){}
	function fa(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
	else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function ga(a){return null!=a}function ha(a){var b=fa(a);return"array"==b||"object"==b&&"number"==typeof a.length}function ia(a){return"string"==typeof a}function ja(a){return"function"==fa(a)}function ka(a){return a[la]||(a[la]=++ma)}var la="closure_uid_"+(1E9*Math.random()>>>0),ma=0;function na(a,b,c){return a.call.apply(a.bind,arguments)}
	function oa(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function pa(a,b,c){pa=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?na:oa;return pa.apply(null,arguments)}
	function qa(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var b=c.slice();b.push.apply(b,arguments);return a.apply(this,b)}}function q(a,b){var c=a.split("."),d=ca;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)!c.length&&p(b)?d[e]=b:d=d[e]?d[e]:d[e]={}}
	function r(a,b){function c(){}c.prototype=b.prototype;a.hb=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Xg=function(a,c,f){for(var h=Array(arguments.length-2),k=2;k<arguments.length;k++)h[k-2]=arguments[k];return b.prototype[c].apply(a,h)}};function ra(a){if(Error.captureStackTrace)Error.captureStackTrace(this,ra);else{var b=Error().stack;b&&(this.stack=b)}a&&(this.message=String(a))}r(ra,Error);ra.prototype.name="CustomError";var sa=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")};
	function ta(a){var b=0,c=sa(String(ua)).split(".");a=sa(String(a)).split(".");for(var d=Math.max(c.length,a.length),e=0;0==b&&e<d;e++){var f=c[e]||"",h=a[e]||"",k=/(\d*)(\D*)/g,n=/(\d*)(\D*)/g;do{var B=k.exec(f)||["","",""],O=n.exec(h)||["","",""];if(0==B[0].length&&0==O[0].length)break;b=va(0==B[1].length?0:parseInt(B[1],10),0==O[1].length?0:parseInt(O[1],10))||va(0==B[2].length,0==O[2].length)||va(B[2],O[2])}while(0==b)}return b}function va(a,b){return a<b?-1:a>b?1:0};function wa(a,b,c){this.rg=c;this.Rf=a;this.Mg=b;this.td=0;this.jd=null}wa.prototype.get=function(){var a;0<this.td?(this.td--,a=this.jd,this.jd=a.next,a.next=null):a=this.Rf();return a};wa.prototype.put=function(a){this.Mg(a);this.td<this.rg&&(this.td++,a.next=this.jd,this.jd=a)};var xa=Array.prototype.indexOf?function(a,b,c){return Array.prototype.indexOf.call(a,b,c)}:function(a,b,c){c=null==c?0:0>c?Math.max(0,a.length+c):c;if(ia(a))return ia(b)&&1==b.length?a.indexOf(b,c):-1;for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},ya=Array.prototype.forEach?function(a,b,c){Array.prototype.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=ia(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)},za=Array.prototype.map?function(a,b,c){return Array.prototype.map.call(a,
	b,c)}:function(a,b,c){for(var d=a.length,e=Array(d),f=ia(a)?a.split(""):a,h=0;h<d;h++)h in f&&(e[h]=b.call(c,f[h],h,a));return e},Aa=Array.prototype.reduce?function(a,b,c,d){d&&(b=pa(b,d));return Array.prototype.reduce.call(a,b,c)}:function(a,b,c,d){var e=c;ya(a,function(c,h){e=b.call(d,e,c,h,a)});return e},Ba=Array.prototype.some?function(a,b,c){return Array.prototype.some.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=ia(a)?a.split(""):a,f=0;f<d;f++)if(f in e&&b.call(c,e[f],f,a))return!0;return!1};
	function Ca(a,b,c){return 2>=arguments.length?Array.prototype.slice.call(a,b):Array.prototype.slice.call(a,b,c)}function Da(a){for(var b=[],c=0;c<a;c++)b[c]=0;return b}function Ea(a){for(var b=[],c=0;c<arguments.length;c++){var d=arguments[c];if("array"==fa(d))for(var e=0;e<d.length;e+=8192)for(var f=Ea.apply(null,Ca(d,e,e+8192)),h=0;h<f.length;h++)b.push(f[h]);else b.push(d)}return b};function Fa(a){var b=[],c=0,d;for(d in a)b[c++]=a[d];return b};var Ga;a:{var Ha=ca.navigator;if(Ha){var Ia=Ha.userAgent;if(Ia){Ga=Ia;break a}}Ga=""}function t(a){return-1!=Ga.indexOf(a)};function Ja(){return t("Opera")||t("OPR")}function Ka(){return(t("Chrome")||t("CriOS"))&&!Ja()&&!t("Edge")};function La(a){ca.setTimeout(function(){throw a;},0)}var Na;
	function Oa(){var a=ca.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!t("Presto")&&(a=function(){var a=document.createElement("IFRAME");a.style.display="none";a.src="";document.documentElement.appendChild(a);var b=a.contentWindow,a=b.document;a.open();a.write("");a.close();var c="callImmediate"+Math.random(),d="file:"==b.location.protocol?"*":b.location.protocol+"//"+b.location.host,a=pa(function(a){if(("*"==d||a.origin==d)&&a.data==
	c)this.port1.onmessage()},this);b.addEventListener("message",a,!1);this.port1={};this.port2={postMessage:function(){b.postMessage(c,d)}}});if("undefined"!==typeof a&&!t("Trident")&&!t("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(p(c.next)){c=c.next;var a=c.Ge;c.Ge=null;a()}};return function(a){d.next={Ge:a};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?function(a){var b=document.createElement("SCRIPT");
	b.onreadystatechange=function(){b.onreadystatechange=null;b.parentNode.removeChild(b);b=null;a();a=null};document.documentElement.appendChild(b)}:function(a){ca.setTimeout(a,0)}};function Pa(){this.Dd=this.rc=null}var Ra=new wa(function(){return new Qa},function(a){a.reset()},100);Pa.prototype.add=function(a,b){var c=Ra.get();c.set(a,b);this.Dd?this.Dd.next=c:this.rc=c;this.Dd=c};Pa.prototype.remove=function(){var a=null;this.rc&&(a=this.rc,this.rc=this.rc.next,this.rc||(this.Dd=null),a.next=null);return a};function Qa(){this.next=this.scope=this.Vd=null}Qa.prototype.set=function(a,b){this.Vd=a;this.scope=b;this.next=null};
	Qa.prototype.reset=function(){this.next=this.scope=this.Vd=null};function Sa(a,b){Ta||Ua();Va||(Ta(),Va=!0);Wa.add(a,b)}var Ta;function Ua(){if(ca.Promise&&ca.Promise.resolve){var a=ca.Promise.resolve(void 0);Ta=function(){a.then(Xa)}}else Ta=function(){var a=Xa;!ja(ca.setImmediate)||ca.Window&&ca.Window.prototype&&!t("Edge")&&ca.Window.prototype.setImmediate==ca.setImmediate?(Na||(Na=Oa()),Na(a)):ca.setImmediate(a)}}var Va=!1,Wa=new Pa;function Xa(){for(var a=null;a=Wa.remove();){try{a.Vd.call(a.scope)}catch(b){La(b)}Ra.put(a)}Va=!1};function u(a,b){this.Sa=0;this.qf=void 0;this.Yc=this.gc=this.F=null;this.hd=this.Td=!1;if(a!=da)try{var c=this;a.call(b,function(a){Ya(c,2,a)},function(a){Ya(c,3,a)})}catch(d){Ya(this,3,d)}}function Za(){this.next=this.context=this.lc=this.Lc=this.child=null;this.Gd=!1}Za.prototype.reset=function(){this.context=this.lc=this.Lc=this.child=null;this.Gd=!1};var $a=new wa(function(){return new Za},function(a){a.reset()},100);function ab(a,b,c){var d=$a.get();d.Lc=a;d.lc=b;d.context=c;return d}
	function v(a){if(a instanceof u)return a;var b=new u(da);Ya(b,2,a);return b}function bb(a){return new u(function(b,c){c(a)})}function cb(a,b,c){db(a,b,c,null)||Sa(qa(b,a))}function eb(a){return new u(function(b,c){var d=a.length,e=[];if(d)for(var f=function(a,c){d--;e[a]=c;0==d&&b(e)},h=function(a){c(a)},k=0,n;k<a.length;k++)n=a[k],cb(n,qa(f,k),h);else b(e)})}function fb(){var a,b,c=new u(function(c,e){a=c;b=e});return new gb(c,a,b)}
	u.prototype.then=function(a,b,c){return hb(this,ja(a)?a:null,ja(b)?b:null,c)};u.prototype.then=u.prototype.then;u.prototype.$goog_Thenable=!0;u.prototype.we=function(a,b){return hb(this,null,a,b)};function ib(a,b){a.gc||2!=a.Sa&&3!=a.Sa||jb(a);a.Yc?a.Yc.next=b:a.gc=b;a.Yc=b}
	function hb(a,b,c,d){var e=ab(null,null,null);e.child=new u(function(a,h){e.Lc=b?function(c){try{var e=b.call(d,c);a(e)}catch(B){h(B)}}:a;e.lc=c?function(b){try{var e=c.call(d,b);!p(e)&&b instanceof kb?h(b):a(e)}catch(B){h(B)}}:h});e.child.F=a;ib(a,e);return e.child}u.prototype.Sg=function(a){this.Sa=0;Ya(this,2,a)};u.prototype.Tg=function(a){this.Sa=0;Ya(this,3,a)};
	function Ya(a,b,c){0==a.Sa&&(a==c&&(b=3,c=new TypeError("Promise cannot resolve to itself")),a.Sa=1,db(c,a.Sg,a.Tg,a)||(a.qf=c,a.Sa=b,a.F=null,jb(a),3!=b||c instanceof kb||lb(a,c)))}function db(a,b,c,d){if(a instanceof u)return ib(a,ab(b||da,c||null,d)),!0;var e;if(a)try{e=!!a.$goog_Thenable}catch(h){e=!1}else e=!1;if(e)return a.then(b,c,d),!0;e=typeof a;if("object"==e&&null!=a||"function"==e)try{var f=a.then;if(ja(f))return mb(a,f,b,c,d),!0}catch(h){return c.call(d,h),!0}return!1}
	function mb(a,b,c,d,e){function f(a){k||(k=!0,d.call(e,a))}function h(a){k||(k=!0,c.call(e,a))}var k=!1;try{b.call(a,h,f)}catch(n){f(n)}}function jb(a){a.Td||(a.Td=!0,Sa(a.Yf,a))}function nb(a){var b=null;a.gc&&(b=a.gc,a.gc=b.next,b.next=null);a.gc||(a.Yc=null);return b}
	u.prototype.Yf=function(){for(var a=null;a=nb(this);){var b=this.Sa,c=this.qf;if(3==b&&a.lc&&!a.Gd)for(var d=void 0,d=this;d&&d.hd;d=d.F)d.hd=!1;if(a.child)a.child.F=null,ob(a,b,c);else try{a.Gd?a.Lc.call(a.context):ob(a,b,c)}catch(e){pb.call(null,e)}$a.put(a)}this.Td=!1};function ob(a,b,c){2==b?a.Lc.call(a.context,c):a.lc&&a.lc.call(a.context,c)}function lb(a,b){a.hd=!0;Sa(function(){a.hd&&pb.call(null,b)})}var pb=La;function kb(a){ra.call(this,a)}r(kb,ra);kb.prototype.name="cancel";
	function gb(a,b,c){this.ha=a;this.resolve=b;this.reject=c};function qb(a,b,c,d){c=c||function(a,b){return a==b};d=d||function(b){return a[b]};for(var e=a.length,f=b.length,h=[],k=0;k<e+1;k++)h[k]=[],h[k][0]=0;for(var n=0;n<f+1;n++)h[0][n]=0;for(k=1;k<=e;k++)for(n=1;n<=f;n++)c(a[k-1],b[n-1])?h[k][n]=h[k-1][n-1]+1:h[k][n]=Math.max(h[k-1][n],h[k][n-1]);for(var B=[],k=e,n=f;0<k&&0<n;)c(a[k-1],b[n-1])?(B.unshift(d(k-1,n-1)),k--,n--):h[k-1][n]>h[k][n-1]?k--:n--;return B}function rb(a){return Aa(arguments,function(a,c){return a+c},0)}
	function sb(a){return rb.apply(null,arguments)/arguments.length}function tb(a){var b=arguments.length;if(2>b)return 0;var c=sb.apply(null,arguments);return rb.apply(null,za(arguments,function(a){return Math.pow(a-c,2)}))/(b-1)}function ub(a){return Math.sqrt(tb.apply(null,arguments))};var vb="StopIteration"in ca?ca.StopIteration:{message:"StopIteration",stack:""};function wb(){}wb.prototype.next=function(){throw vb;};wb.prototype.sc=function(){return this};function xb(a){if(a instanceof wb)return a;if("function"==typeof a.sc)return a.sc(!1);if(ha(a)){var b=0,c=new wb;c.next=function(){for(;;){if(b>=a.length)throw vb;if(b in a)return a[b++];b++}};return c}throw Error("Not implemented");}
	function yb(a,b){if(ha(a))try{ya(a,b,void 0)}catch(c){if(c!==vb)throw c;}else{a=xb(a);try{for(;;)b.call(void 0,a.next(),void 0,a)}catch(c){if(c!==vb)throw c;}}}function zb(a){if(Ba(arguments,function(a){return!a.length})||!arguments.length)return new wb;var b=new wb,c=arguments,d=Da(c.length);b.next=function(){if(d){for(var a=za(d,function(a,b){return c[b][a]}),b=d.length-1;0<=b;b--){if(d[b]<c[b].length-1){d[b]++;break}if(0==b){d=null;break}d[b]=0}return a}throw vb;};return b};function Ab(a,b){this.l={};this.a=[];this.Ta=this.Gb=0;var c=arguments.length;if(1<c){if(c%2)throw Error("Uneven number of arguments");for(var d=0;d<c;d+=2)this.set(arguments[d],arguments[d+1])}else a&&this.addAll(a)}m=Ab.prototype;m.Cc=g("Gb");m.ra=function(){Bb(this);for(var a=[],b=0;b<this.a.length;b++)a.push(this.l[this.a[b]]);return a};function Eb(a){Bb(a);return a.a.concat()}m.Oa=function(a){return Fb(this.l,a)};m.md=function(){return 0==this.Gb};
	m.clear=function(){this.l={};this.Ta=this.Gb=this.a.length=0};m.remove=function(a){return Fb(this.l,a)?(delete this.l[a],this.Gb--,this.Ta++,this.a.length>2*this.Gb&&Bb(this),!0):!1};function Bb(a){if(a.Gb!=a.a.length){for(var b=0,c=0;b<a.a.length;){var d=a.a[b];Fb(a.l,d)&&(a.a[c++]=d);b++}a.a.length=c}if(a.Gb!=a.a.length){for(var e={},c=b=0;b<a.a.length;)d=a.a[b],Fb(e,d)||(a.a[c++]=d,e[d]=1),b++;a.a.length=c}}m.get=function(a,b){return Fb(this.l,a)?this.l[a]:b};
	m.set=function(a,b){Fb(this.l,a)||(this.Gb++,this.a.push(a),this.Ta++);this.l[a]=b};m.addAll=function(a){var b;if(a instanceof Ab)b=Eb(a),a=a.ra();else{b=[];var c=0,d;for(d in a)b[c++]=d;a=Fa(a)}for(c=0;c<b.length;c++)this.set(b[c],a[c])};m.forEach=function(a,b){for(var c=Eb(this),d=0;d<c.length;d++){var e=c[d],f=this.get(e);a.call(b,f,e,this)}};m.clone=function(){return new Ab(this)};
	m.sc=function(a){Bb(this);var b=0,c=this.Ta,d=this,e=new wb;e.next=function(){if(c!=d.Ta)throw Error("The map has changed since the iterator was created");if(b>=d.a.length)throw vb;var e=d.a[b++];return a?e:d.l[e]};return e};function Fb(a,b){return Object.prototype.hasOwnProperty.call(a,b)};function Gb(){return t("iPhone")&&!t("iPod")&&!t("iPad")};var Hb=Ja(),Ib=t("Trident")||t("MSIE"),Jb=t("Edge"),Kb=t("Gecko")&&!(-1!=Ga.toLowerCase().indexOf("webkit")&&!t("Edge"))&&!(t("Trident")||t("MSIE"))&&!t("Edge"),Lb=-1!=Ga.toLowerCase().indexOf("webkit")&&!t("Edge"),Mb;
	a:{var Nb="",Ob=function(){var a=Ga;if(Kb)return/rv\:([^\);]+)(\)|;)/.exec(a);if(Jb)return/Edge\/([\d\.]+)/.exec(a);if(Ib)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(Lb)return/WebKit\/(\S+)/.exec(a);if(Hb)return/(?:Version)[ \/]?(\S+)/.exec(a)}();Ob&&(Nb=Ob?Ob[1]:"");if(Ib){var Pb,Qb=ca.document;Pb=Qb?Qb.documentMode:void 0;if(null!=Pb&&Pb>parseFloat(Nb)){Mb=String(Pb);break a}}Mb=Nb}var ua=Mb,Rb={};var Sb=Gb()||t("iPod"),Tb=t("iPad"),Ub=Ka(),Vb=t("Safari")&&!(Ka()||t("Coast")||Ja()||t("Edge")||t("Silk")||t("Android"))&&!(Gb()||t("iPad")||t("iPod"));/*

	 Copyright 2015 The Lovefield Project Authors. All Rights Reserved.

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	     http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	*/
	function Wb(){this.qe=Vb||Tb||Sb;this.hg=!(this.qe||Ib&&!Rb[10]&&!(Rb[10]=0<=ta(10)));!Ib||Rb[11]||(Rb[11]=0<=ta(11));this.Wg=Ub||Vb;this.wg=p(window.Map)&&p(window.Map.prototype.values)&&p(window.Map.prototype.forEach)&&!this.qe;this.xg=p(window.Set)&&p(window.Set.prototype.values)&&p(window.Set.prototype.forEach)&&!this.qe}var Xb;function Yb(){p(Xb)||(Xb=new Wb);return Xb};function w(){this.l=new Ab;Object.defineProperty(this,"size",{get:function(){return this.l.Cc()}})}w.prototype.clear=function(){this.l.clear()};w.prototype.clear=w.prototype.clear;w.prototype.delete=function(a){return this.l.remove(a)};w.prototype["delete"]=w.prototype.delete;w.prototype.forEach=function(a,b){return this.l.forEach(a,b)};w.prototype.forEach=w.prototype.forEach;w.prototype.get=function(a){return this.l.get(a)};w.prototype.get=w.prototype.get;w.prototype.has=function(a){return this.l.Oa(a)};
	w.prototype.has=w.prototype.has;w.prototype.set=function(a,b){return this.l.set(a,b)};w.prototype.set=w.prototype.set;var Zb=Yb().wg;function x(){return Zb?new window.Map:new w}function $b(a){if(a instanceof w)return Eb(a.l);var b=0,c=Array(a.size);a.forEach(function(a,e){c[b++]=e});return c}function y(a){if(a instanceof w)return a.l.ra();var b=0,c=Array(a.size);a.forEach(function(a){c[b++]=a});return c};/*

	 Copyright 2014 The Lovefield Project Authors. All Rights Reserved.

	 Licensed under the Apache License, Version 2.0 (the "License");
	 you may not use this file except in compliance with the License.
	 You may obtain a copy of the License at

	     http://www.apache.org/licenses/LICENSE-2.0

	 Unless required by applicable law or agreed to in writing, software
	 distributed under the License is distributed on an "AS IS" BASIS,
	 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 See the License for the specific language governing permissions and
	 limitations under the License.
	*/
	function ac(a,b){this.sa=a;this.m=b||this.Le()}var bc=0;m=ac.prototype;m.id=g("sa");m.Le=function(){return{}};m.yf=g("m");m.Ja=function(){return{id:this.sa,value:this.yf()}};m.pb=function(a){return"#"==a.substr(-1)?this.sa:null};function cc(a){return new ac(a.id,a.value)}function dc(a){return new ac(bc++,a||{})}function fc(a){if(null==a)return null;a=new Uint8Array(a);for(var b="",c=0;c<a.length;++c)var d=a[c].toString(16),b=b+(2>d.length?"0"+d:d);return b};var gc={};q("lf.TransactionType",gc);gc.READ_ONLY=0;gc.READ_WRITE=1;function z(a,b,c,d,e){this.yd=a;this.lg=b;this.Vg=c;this.Tf=d;this.Lf=e}q("lf.TransactionStats",z);z.prototype.Qg=g("yd");z.prototype.success=z.prototype.Qg;z.prototype.kg=g("lg");z.prototype.insertedRowCount=z.prototype.kg;z.prototype.Ug=g("Vg");z.prototype.updatedRowCount=z.prototype.Ug;z.prototype.Sf=g("Tf");z.prototype.deletedRowCount=z.prototype.Sf;z.prototype.Kf=g("Lf");z.prototype.changedTableCount=z.prototype.Kf;function hc(a,b){this.Ad=a;this.Qa=b||null;this.S=fb();this.yd=!1;this.za=null}hc.prototype.ka=function(){return(0==this.Ad?this.vc():ic(this)).then(function(a){this.yd=!0;return a}.bind(this))};function ic(a){try{jc(a.Qa)}catch(b){return bb(b)}return kc(a).then(function(a){this.Qa.ka();return a}.bind(a))}function kc(a){lc(a);mc(a);return a.vc()}
	function lc(a){a.Qa.ib.forEach(function(a,c){var d=this.Qa.da().get(c),d=this.H(d.getName(),d.mb.bind(d),0),e=y(a.xa).map(function(a){return a.id()});0<e.length&&d.remove(e).we(this.Te,this);e=y(a.ma).map(function(a){return a[1]}).concat(y(a.wa));d.put(e).we(this.Te,this)},a)}function mc(a){nc(a.Qa).forEach(function(a){var c=this.H(a.getName(),cc,1);c.remove([]);c.put(a.Ja())},a)}hc.prototype.Te=function(a){this.S.reject(a)};
	hc.prototype.Y=function(){if(null===this.za)if(this.yd)if(0==this.Ad)this.za=new z(!0,0,0,0,0);else{var a=0,b=0,c=0,d=0;this.Qa.ib.forEach(function(e){d++;a+=e.wa.size;c+=e.ma.size;b+=e.xa.size});this.za=new z(!0,a,c,b,d)}else this.za=new z(!1,0,0,0,0);return this.za};function oc(a){this.Ng=a}oc.prototype.toString=g("Ng");var pc=new oc("backstore"),qc=new oc("cache"),rc=new oc("indexstore"),sc=new oc("engine"),tc=new oc("runner"),uc=new oc("observerregistry"),vc=new oc("schema");function wc(a){if(a.ra&&"function"==typeof a.ra)return a.ra();if(ia(a))return a.split("");if(ha(a)){for(var b=[],c=a.length,d=0;d<c;d++)b.push(a[d]);return b}return Fa(a)};function xc(a){this.l=new Ab;a&&this.addAll(a)}function yc(a){var b=typeof a;return"object"==b&&a||"function"==b?"o"+ka(a):b.substr(0,1)+a}m=xc.prototype;m.Cc=function(){return this.l.Cc()};m.add=function(a){this.l.set(yc(a),a)};m.addAll=function(a){a=wc(a);for(var b=a.length,c=0;c<b;c++)this.add(a[c])};m.remove=function(a){return this.l.remove(yc(a))};m.clear=function(){this.l.clear()};m.md=function(){return this.l.md()};m.contains=function(a){return this.l.Oa(yc(a))};m.ra=function(){return this.l.ra()};
	m.clone=function(){return new xc(this)};m.sc=function(){return this.l.sc(!1)};function zc(a){this.$b=new xc(a);Object.defineProperty(this,"size",{get:function(){return this.$b.Cc()}})}zc.prototype.add=function(a){this.$b.add(a)};zc.prototype.add=zc.prototype.add;zc.prototype.clear=function(){this.$b.clear()};zc.prototype.clear=zc.prototype.clear;zc.prototype.delete=function(a){return this.$b.remove(a)};zc.prototype["delete"]=zc.prototype.delete;zc.prototype.forEach=function(a,b){this.$b.ra().forEach(a,b)};zc.prototype.has=function(a){return this.$b.contains(a)};
	zc.prototype.has=zc.prototype.has;var Ac=Yb().xg;function A(a){return Ac?p(a)?new window.Set(a):new window.Set:new zc(a)}function C(a){if(a instanceof zc)return a.$b.ra();var b=0,c=Array(a.size);a.forEach(function(a){c[b++]=a});return c}function Bc(a,b){if(b.size>a.size)return!1;var c=!0;b.forEach(function(b){c=c&&a.has(b)});return c};function Cc(a,b){this.sa=a;this.m=b||{}}function Dc(a){var b=A();a.forEach(function(a){b.add(a>>9)});return C(b)}Cc.prototype.W=g("sa");function Ec(a,b){b.forEach(function(a){this.m[a.id()]=a.Ja()},a)}function Fc(a,b){b.forEach(function(a){delete this.m[a]},a)}Cc.prototype.Ja=function(){return{id:this.sa,value:JSON.stringify(this.m)}};function Gc(a){return new Cc(a.id,JSON.parse(a.value))};function Hc(a,b,c){this.Z=a;this.Ib=b;this.rf=c}m=Hc.prototype;m.get=function(a){if(0==a.length)return this.Wd();var b=this.Ib;return Ic(this,a).then(function(c){return a.map(function(a){var e=c.get(a>>9);return b(e.m[a])})})};function Ic(a,b){var c=x(),d=fb(),e=Dc(b).map(function(a){return new u(function(b,d){var e;try{e=this.Z.get(a)}catch(B){d(B);return}e.onerror=d;e.onsuccess=function(a){a=Gc(a.target.result);c.set(a.W(),a);b()}},this)},a);eb(e).then(function(){d.resolve(c)});return d.ha}
	m.Wd=function(){return new u(function(a,b){var c=[],d;try{d=this.Z.openCursor()}catch(e){b(e);return}d.onerror=b;d.onsuccess=function(){var b=d.result;if(b){var f=Gc(b.value).m,h;for(h in f)c.push(this.Ib(f[h]));b.continue()}else a(c)}.bind(this)},this)};m.Wb=function(a){return new u(function(b,c){var d;try{d=a()}catch(e){c(e);return}d.onsuccess=b;d.onerror=c},this)};
	m.put=function(a){if(0==a.length)return v();var b=x();a.forEach(function(a){var d=a.id()>>9,e=b.get(d)||null;null===e&&(e=this.rf(this.Z.name,d));Ec(e,[a]);b.set(d,e)},this);a=y(b).map(function(a){return this.Wb(function(){return this.Z.put(a.Ja())}.bind(this))},this);return eb(a)};
	m.remove=function(a){if(0==a.length)return this.Wb(function(){return this.Z.clear()}.bind(this));var b=x();a.forEach(function(a){var d=a>>9,e=b.get(d)||null;null===e&&(e=this.rf(this.Z.name,d));Fc(e,[a]);b.set(d,e)},this);a=y(b).map(function(a){return this.Wb(function(){return 0==Object.keys(a.m).length?this.Z.delete(a.W()):this.Z.put(a.Ja())}.bind(this))},this);return eb(a)};function Jc(a,b,c){a=a.b(qc);var d=[c<<9,(c+1<<9)-1];b=a.Ua(b,d[0],d[1]);c=new Cc(c);Ec(c,b);return c}
	function Kc(a,b){return new Cc(b)};function Lc(a){this.V=a.b(qc);this.D=a.b(rc);this.g=a.b(vc)}Lc.prototype.update=function(a){a.forEach(function(a){Mc(this,a);Nc(this,a)},this)};function Nc(a,b){var c=b.getName();b.xa.forEach(function(a,b){this.V.remove(c,b)},a);b.wa.forEach(function(a){this.V.set(c,a)},a);b.ma.forEach(function(a){this.V.set(c,a[1])},a)}function Mc(a,b){var c=a.g.table(b.getName());Oc(b).forEach(function(a){Pc(this,c,a)},a)}
	function Pc(a,b,c){var d=a.D.oc.get(b.getName())||[],e=0;d.forEach(function(a){try{Qc(a,c),e++}catch(b){throw d.slice(0,e).forEach(function(a){Qc(a,[c[1],c[0]])},this),b;}},a)}function Qc(a,b){var c=null===b[1]?void 0:b[1].pb(a.getName()),d=null===b[0]?void 0:b[0].pb(a.getName());if(!p(d)&&p(c))a.add(c,b[1].id());else if(p(d)&&p(c)){if(null===c||null===d){if(c==d)return}else if(0==a.lb().compare(d,c))return;a.add(c,b[1].id());a.remove(d,b[0].id())}else p(d)&&!p(c)&&a.remove(d,b[0].id())};var Rc={};q("lf.ConstraintAction",Rc);Rc.RESTRICT=0;Rc.CASCADE=1;var Sc={};q("lf.ConstraintTiming",Sc);Sc.IMMEDIATE=0;Sc.DEFERRABLE=1;var Tc={};q("lf.Order",Tc);Tc.DESC=0;Tc.ASC=1;var Vc={};q("lf.Type",Vc);Vc.ARRAY_BUFFER=0;Vc.BOOLEAN=1;Vc.DATE_TIME=2;Vc.INTEGER=3;Vc.NUMBER=4;Vc.STRING=5;Vc.OBJECT=6;var Wc={0:null,1:!1,2:Object.freeze(new Date(0)),3:0,4:0,5:"",6:null};q("lf.type.DEFAULT_VALUES",Wc);function D(a,b){this.code=a;this.message="http://google.github.io/lovefield/error_lookup/src/error_lookup.html?c="+a;if(1<arguments.length)for(var c=1;c<=Math.min(4,arguments.length-1);++c)this.message+="&p"+(c-1)+"="+encodeURIComponent(arguments[c].toString().slice(0,64))}r(D,Error);function Xc(){this.l=x();this.size=0}m=Xc.prototype;m.has=function(a){return this.l.has(a)};m.set=function(a,b){var c=this.l.get(a)||null;null===c&&(c=A(),this.l.set(a,c));c.has(b)||(c.add(b),this.size++);return this};m.Zb=function(a,b){var c=this.l.get(a)||null;null===c&&(c=A(),this.l.set(a,c));b.forEach(function(a){c.has(a)||(c.add(a),this.size++)},this);return this};m.ce=function(a){a.keys().forEach(function(b){var c=a.get(b);this.Zb(b,c)},this);return this};
	m.delete=function(a,b){var c=this.l.get(a)||null;if(null===c)return!1;var d=c.delete(b);d&&(--this.size,0==c.size&&this.l.delete(a));return d};m.get=function(a){a=this.l.get(a)||null;return null===a?null:C(a)};m.clear=function(){this.l.clear();this.size=0};m.keys=function(){return $b(this.l)};m.values=function(){var a=[];this.l.forEach(function(b){a.push.apply(a,C(b))});return a};function Yc(a){this.D=a.b(rc);this.g=a.b(vc);this.V=a.b(qc);this.bd=null}function Zc(a,b,c){var d=b.Jb().zg;c.forEach(function(a){d.forEach(function(b){if(null==a.m[b.getName()])throw new D(202,b.j());},this)},a)}function $c(a,b,c,d){b.Jb().Xd().forEach(function(a){a.timing==d&&ad(this,a,c)},a)}function ad(a,b,c){var d=bd(a,b);c.forEach(function(a){if(cd(a[0],a[1],b.name)&&(a=a[1].pb(b.name),null!==a&&!d.Oa(a)))throw new D(203,b.name);},a)}
	function bd(a,b){null===a.bd&&(a.bd=x());var c=a.bd.get(b.name)||null;null===c&&(c=a.g.table(b.Wa)[b.Mc].Ca(),c=a.D.get(c.j()),a.bd.set(b.name,c));return c}function cd(a,b,c){return(null===a?null!==b:null===b)||a.pb(c)!=b.pb(c)}function dd(a,b,c,d){b=ed(a.g.info(),b.getName(),0);null!==b&&(b=b.filter(function(a){return a.timing==d}),0!=b.length&&fd(a,b,c,function(a,b,c){if(b.Oa(c))throw new D(203,a.name);}))}
	function gd(a,b,c){b=ed(a.g.info(),b.getName(),1);if(null===b)return null;var d=new Xc;fd(a,b,c,function(a,b,c){b=b.get(c);0<b.length&&d.Zb(a.He,b)});return d}function hd(a,b,c){var d=new Xc;fd(a,c,b,function(a,b,c,k){b.get(c).forEach(function(b){d.set(b,{Ud:a,Eg:k[1]})})});return d}function fd(a,b,c,d){b.forEach(function(a){var b=this.D.get(a.name),h=bd(this,a);c.forEach(function(c){if(cd(c[0],c[1],h.getName())){var n=c[0].pb(h.getName());d(a,b,n,c)}},this)},a)}
	function id(a,b,c,d){0!=c.length&&(c=c.map(function(a){return[null,a]}),$c(a,b,c,d))}function jd(a,b,c,d){0!=c.length&&($c(a,b,c,d),dd(a,b,c,d))}function kd(a,b,c,d){0!=c.length&&(c=c.map(function(a){return[a,null]}),dd(a,b,c,d))}
	function ld(a,b,c){var d={ve:[],tf:new Xc},e=new Xc;e.Zb(b.getName(),c.map(function(a){return a.id()}));do{var f=new Xc;e.keys().forEach(function(a){var b=this.g.table(a);a=e.get(a).map(function(a){return[this.V.get(a),null]},this);b=gd(this,b,a);null!==b&&(d.ve.unshift.apply(d.ve,b.keys()),f.ce(b))},a);e=f;d.tf.ce(e)}while(0<e.size);return d};function md(a){this.wa=x();this.ma=x();this.xa=x();this.A=a}m=md.prototype;m.getName=g("A");m.add=function(a){if(this.xa.has(a.id())){var b=[this.xa.get(a.id()),a];this.ma.set(a.id(),b);this.xa.delete(a.id())}else this.wa.set(a.id(),a)};m.modify=function(a){var b=a[1],c=a[0].id();this.wa.has(c)?this.wa.set(c,b):(this.ma.has(c)&&(a=[this.ma.get(a[0].id())[0],b]),this.ma.set(c,a))};
	m.delete=function(a){if(this.wa.has(a.id()))this.wa.delete(a.id());else if(this.ma.has(a.id())){var b=this.ma.get(a.id())[0];this.ma.delete(a.id());this.xa.set(a.id(),b)}else this.xa.set(a.id(),a)};m.ce=function(a){a.wa.forEach(function(a){this.add(a)},this);a.ma.forEach(function(a){this.modify(a)},this);a.xa.forEach(function(a){this.delete(a)},this)};
	function Oc(a){var b=[];a.wa.forEach(function(a){b.push([null,a])});a.ma.forEach(function(a){b.push(a)});a.xa.forEach(function(a){b.push([a,null])});return b}m.toString=function(){return"["+$b(this.wa).toString()+"], ["+$b(this.ma).toString()+"], ["+$b(this.xa).toString()+"]"};function nd(a){var b=new md(a.A);a.wa.forEach(function(a){b.delete(a)});a.xa.forEach(function(a){b.add(a)});a.ma.forEach(function(a){b.modify([a[1],a[0]])});return b}
	m.md=function(){return 0==this.wa.size&&0==this.xa.size&&0==this.ma.size};function od(a,b){this.aa=x();b.forEach(function(a){this.aa.set(a.getName(),a)},this);this.g=a.b(vc);this.V=a.b(qc);this.D=a.b(rc);this.Aa=new Yc(a);this.kd=new Lc(a);this.ib=x()}function nc(a){var b=[];$b(a.ib).map(function(a){return this.aa.get(a)},a).forEach(function(a){a.Fb()&&(a.Da().forEach(function(a){b.push(this.D.get(a.j()))},this),b.push(this.D.get(a.getName()+".#")))},a);return b}m=od.prototype;m.da=g("aa");
	m.Db=function(a,b){pd(this,a);Zc(this.Aa,a,b);id(this.Aa,a,b,0);for(var c=0;c<b.length;c++)qd(this,a,[null,b[c]])};function qd(a,b,c){var d=b.getName(),e=a.ib.get(d)||new md(d);a.ib.set(d,e);try{Pc(a.kd,b,c)}catch(h){throw h;}b=c[0];var f=c[1];null===b&&null!==f?(a.V.set(d,f),e.add(f)):null!==b&&null!==f?(a.V.set(d,f),e.modify(c)):null!==b&&null===f&&(a.V.remove(d,b.id()),e.delete(b))}
	m.update=function(a,b){pd(this,a);Zc(this.Aa,a,b);var c=b.map(function(a){return[this.V.get(a.id()),a]},this);rd(this,a,c);jd(this.Aa,a,c,0);c.forEach(function(b){qd(this,a,b)},this)};m.Yd=function(a,b){pd(this,a);Zc(this.Aa,a,b);for(var c=0;c<b.length;c++){var d=b[c],e=null,f,h=a.Jb().ed();if(null===h)f=null;else{f=this.Aa;var h=h.j(),k=d.pb(h);f=f.D.get(h).get(k);f=0==f.length?null:f[0]}null!=f?(e=this.V.get(f),d.sa=f,jd(this.Aa,a,[[e,d]],0)):id(this.Aa,a,[d],0);qd(this,a,[e,d])}};
	m.remove=function(a,b){pd(this,a);sd(this,a,b);kd(this.Aa,a,b,0);for(var c=0;c<b.length;c++)qd(this,a,[b[c],null])};function rd(a,b,c){b=ed(a.g.info(),b.getName(),1);if(null!==b){var d=hd(a.Aa,c,b);d.keys().forEach(function(a){d.get(a).forEach(function(b){var c=this.g.table(b.Ud.He),d=this.V.get(a),n=c.mb(d.Ja());n.m[b.Ud.yb]=b.Eg.m[b.Ud.Mc];qd(this,c,[d,n])},this)},a)}}
	function sd(a,b,c){if(null!==ed(a.g.info(),b.getName(),1)){b=ld(a.Aa,b,c);var d=b.tf;b.ve.forEach(function(a){var b=this.g.table(a);a=d.get(a).map(function(a){return this.V.get(a)},this);kd(this.Aa,b,a,0);a.forEach(function(a){qd(this,b,[a,null])},this)},a)}}function jc(a){a.ib.forEach(function(a){var c=this.aa.get(a.getName());id(this.Aa,c,y(a.wa),1);kd(this.Aa,c,y(a.xa),1);jd(this.Aa,c,y(a.ma),1)},a)}m.ka=aa();m.Mb=function(){var a=y(this.ib).map(function(a){return nd(a)});this.kd.update(a)};
	function pd(a,b){if(!a.aa.has(b.getName()))throw new D(106,b.getName());};function E(a,b,c,d){this.from=a;this.o=b;this.ea=this.from==F?!1:c;this.oa=this.o==F?!1:d}var F=new (aa());E.prototype.toString=function(){return(this.ea?"(":"[")+(this.from==F?"unbound":this.from)+", "+(this.o==F?"unbound":this.o)+(this.oa?")":"]")};function td(a){if(ud(a))return[];var b=null,c=null;a.from==F||(b=new E(F,a.from,!1,!a.ea));a.o==F||(c=new E(a.o,F,!a.oa,!1));return[b,c].filter(function(a){return null!==a})}E.prototype.reverse=function(){return new E(this.o,this.from,this.oa,this.ea)};
	function vd(a,b){var c=wd(a.from,b.from,!0,a.ea,b.ea);if(0==c)return!0;var d=-1==c?a:b,c=1==c?a:b;return d.o==F||d.o>c.from||d.o==c.from&&!d.oa&&!c.ea}function xd(){return new E(F,F,!1,!1)}function ud(a){return a.from==F&&a.o==F}function yd(a){return a.from==a.o&&a.from!=F&&!a.ea&&!a.oa}E.prototype.contains=function(a){var b=this.o==F||a<this.o||a==this.o&&!this.oa;return(this.from==F||a>this.from||a==this.from&&!this.ea)&&b};
	function wd(a,b,c,d,e){function f(a){return c?a:1==a?-1:1}d=d||!1;e=e||!1;return a==F?b==F?(d?!e:e)?d?f(1):f(-1):0:f(-1):b==F?f(1):a<b?-1:a==b?(d?!e:e)?d?f(1):f(-1):0:1}function zd(a,b){var c=wd(a.from,b.from,!0,a.ea,b.ea);0==c&&(c=wd(a.o,b.o,!1,a.oa,b.oa));return c}function Ad(a){if(0==a.length)return[];a.sort(zd);for(var b=Array(a.length+1),c=0;c<b.length;c++)b[c]=0==c?new E(F,a[c].from,!1,!0):c==b.length-1?new E(a[c-1].o,F,!0,!1):new E(a[c-1].o,a[c].from,!0,!0);return b};function Bd(a){this.nc=[];p(a)&&this.add(a)}Bd.prototype.toString=function(){return this.nc.map(function(a){return a.toString()}).join(",")};Bd.prototype.Oa=function(a){return this.nc.some(function(b){return b.contains(a)})};Bd.prototype.ra=g("nc");
	Bd.prototype.add=function(a){if(0!=a.length)if(a=this.nc.concat(a),1==a.length)this.nc=a;else{a.sort(zd);for(var b=[],c=a[0],d=1;d<a.length;++d)if(vd(c,a[d])){var e=a[d],f=xd();if(c.from!=F&&e.from!=F){var h=wd(c.from,e.from,!0);1!=h?(f.from=c.from,f.ea=0!=h?c.ea:c.ea&&e.ea):(f.from=e.from,f.ea=e.ea)}c.o!=F&&e.o!=F&&(h=wd(c.o,e.o,!1),-1!=h?(f.o=c.o,f.oa=0!=h?c.oa:c.oa&&e.oa):(f.o=e.o,f.oa=e.oa));c=f}else b.push(c),c=a[d];b.push(c);this.nc=b}};
	function Cd(a,b){var c=[];a.ra().map(function(a){return b.ra().map(function(b){var c;if(vd(a,b)){c=xd();var h=wd(a.from,b.from,!0),h=0==h?a.ea?a:b:-1!=h?a:b;c.from=h.from;c.ea=h.ea;a.o==F||b.o==F?b=a.o==F?b:a:(h=wd(a.o,b.o,!1),b=0==h?a.oa?a:b:-1==h?a:b);c.o=b.o;c.oa=b.oa}else c=null;return c})}).forEach(function(a){c=c.concat(a)});return new Bd(c.filter(function(a){return null!==a}))};function G(a,b){this.entries=a;this.M=A(b);this.Za=null}G.prototype.s=function(){return C(this.M)};function Dd(a){return a.entries.map(function(a){return a.va.m})}function Ed(a){return a.entries.map(function(a){return a.va.id()})}function Fd(a,b){return a.Za.get(b.j())}var Gd=null;function Hd(){null===Gd&&(Gd=new G([],[]));return Gd}
	function Id(a){if(0==a.length)return Hd();for(var b=a.reduce(function(a,b){return a+b.entries.length},0),c=Array(b),d=0,b=a.map(function(a){var b=x();a.entries.forEach(function(a){c[d++]=a;b.set(a.id,a)});return b}),e=x(),f=0;f<c.length;f++)b.every(function(a){return a.has(c[f].id)})&&e.set(c[f].id,c[f]);return new G(y(e),C(a[0].M))}function Jd(a){if(0==a.length)return Hd();var b=x();a.forEach(function(a){a.entries.forEach(function(a){b.set(a.id,a)})});return new G(y(b),C(a[0].M))}
	function Kd(a,b){var c=1<b.length,d=a.map(function(a){return new Ld(a,c)});return new G(d,b)}function Ld(a,b){this.va=a;this.id=Md++;this.$d=b}var Md=0;function H(a,b){var c=b.$a();return null!==c&&a.va.m.hasOwnProperty(c)?a.va.m[c]:a.$d?a.va.m[Nd(b.H())][b.getName()]:a.va.m[b.getName()]}function Od(a,b,c){var d=b.$a();if(null!=d)a.va.m[d]=c;else if(a.$d){var d=Nd(b.H()),e=a.va.m[d];null==e&&(e={},a.va.m[d]=e);e[b.getName()]=c}else a.va.m[b.getName()]=c}
	function Pd(a,b,c,d){function e(a,b){if(a.$d){var c=a.va.m,d;for(d in c)f[d]=c[d]}else f[b[0]]=a.va.m}var f={};e(a,b);e(c,d);a=new ac(-1,f);return new Ld(a,!0)};q("lf.bind",function(a){return new Qd(a)});function Qd(a){this.fa=a}q("lf.Binder",Qd);Qd.prototype.Ca=g("fa");function Rd(){this.Ze=Sd();var a=Td();this.Qb=x();this.Qb.set(1,Ud());this.Qb.set(2,Vd());this.Qb.set(4,a);this.Qb.set(3,a);this.Qb.set(5,Wd());this.Qb.set(6,Xd())}var Yd;function Zd(){null!=Yd||(Yd=new Rd);return Yd}function $d(a,b,c){a=a.Qb.get(b)||null;if(null===a)throw new D(550);c=a.get(c)||null;if(null===c)throw new D(550);return c}
	function Sd(){function a(a){return a}var b=x();b.set(1,function(a){return null===a?null:a?1:0});b.set(2,function(a){return null===a?null:a.getTime()});b.set(3,a);b.set(4,a);b.set(5,a);return b}function Ud(){var a=x();a.set("eq",function(a,c){return a==c});a.set("neq",function(a,c){return a!=c});return a}
	function Td(){var a=Ud();a.set("between",function(a,c){return null===a||null===c[0]||null===c[1]?!1:a>=c[0]&&a<=c[1]});a.set("gte",function(a,c){return null===a||null===c?!1:a>=c});a.set("gt",function(a,c){return null===a||null===c?!1:a>c});a.set("in",function(a,c){return-1!=c.indexOf(a)});a.set("lte",function(a,c){return null===a||null===c?!1:a<=c});a.set("lt",function(a,c){return null===a||null===c?!1:a<c});return a}
	function Wd(){var a=Td();a.set("match",function(a,c){return null===a||null===c?!1:(new RegExp(c)).test(a)});return a}function Xd(){var a=x();a.set("eq",function(a,c){if(null!==c)throw new D(550);return null===a});a.set("neq",function(a,c){if(null!==c)throw new D(550);return null!==a});return a}
	function Vd(){var a=x();a.set("between",function(a,c){return null===a||null===c[0]||null===c[1]?!1:a.getTime()>=c[0].getTime()&&a.getTime()<=c[1].getTime()});a.set("eq",function(a,c){return(null===a?-1:a.getTime())==(null===c?-1:c.getTime())});a.set("gte",function(a,c){return null===a||null===c?!1:a.getTime()>=c.getTime()});a.set("gt",function(a,c){return null===a||null===c?!1:a.getTime()>c.getTime()});a.set("in",function(a,c){return c.some(function(c){return c.getTime()==a.getTime()})});a.set("lte",
	function(a,c){return null===a||null===c?!1:a.getTime()<=c.getTime()});a.set("lt",function(a,c){return null===a||null===c?!1:a.getTime()<c.getTime()});a.set("neq",function(a,c){return(null===a?-1:a.getTime())!=(null===c?-1:c.getTime())});return a};function I(){this.h=this.F=null}var ae=[];I.prototype.getParent=g("F");I.prototype.ab=function(){for(var a=this;null!==a.getParent();)a=a.getParent();return a};function be(a){for(var b=0;null!==a.getParent();)b++,a=a.getParent();return b}function J(a){return a.h||ae}function ce(a,b){return J(a)[b]||null}function de(a,b,c){b.F=a;null===a.h?a.h=[b]:a.h.splice(c,0,b)}function K(a,b){b.F=a;null===a.h?a.h=[b]:a.h.push(b)}
	function ee(a,b){var c=a.h&&a.h[b];return c?(c.F=null,a.h.splice(b,1),0==a.h.length&&(a.h=null),c):null}I.prototype.removeChild=function(a){return ee(this,J(this).indexOf(a))};function fe(a,b,c){ce(a,c).F=null;b.F=a;a.h[c]=b}function ge(a,b,c){!1!==b.call(c,a)&&J(a).forEach(function(a){ge(a,b,c)})};function he(){I.call(this);this.sa=ie++}r(he,I);var ie=0;he.prototype.W=g("sa");function je(a,b,c){he.call(this);this.J=a;this.value=b;this.C=c;this.yc=$d(Zd(),this.J.I(),this.C);this.Va=!1;this.fc=b}r(je,he);m=je.prototype;m.Pb=function(){var a=new je(this.J,this.value,this.C);a.fc=this.fc;a.xd(this.Va);var b=this.W();a.sa=b;return a};m.nb=function(a){return null!=a?(a.push(this.J),a):[this.J]};m.s=function(a){a=null!=a?a:A();a.add(this.J.H());return a};m.xd=ba("Va");
	function ke(a){var b=!1;a.value instanceof Qd||(b="array"==fa(a.value)?!a.value.some(function(a){return a instanceof Qd}):!0);if(!b)throw new D(501);}m.eval=function(a){ke(this);if("in"==this.C)return le(this,a);var b=a.entries.filter(function(a){return this.yc(H(a,this.J),this.value)!=this.Va},this);return new G(b,a.s())};
	m.bind=function(a){if(this.fc instanceof Qd){var b=this.fc.Ca();if(a.length<=b)throw new D(510);this.value=a[b]}else"array"==fa(this.fc)&&(this.value=this.fc.map(function(b){if(b instanceof Qd){var d=b.Ca();if(a.length<=d)throw new D(510);return a[b.Ca()]}return b}))};function le(a,b){var c=A(a.value),d=function(a){return null===a?!1:c.has(a)!=this.Va}.bind(a),e=b.entries.filter(function(a){return d(H(a,this.J))},a);return new G(e,b.s())}
	m.toString=function(){return"value_pred("+this.J.j()+" "+this.C+(this.Va?"(complement)":"")+" "+this.value+")"};m.od=function(){ke(this);return null!==this.value&&("between"==this.C||"in"==this.C||"eq"==this.C||"gt"==this.C||"gte"==this.C||"lt"==this.C||"lte"==this.C)};
	m.xe=function(){var a=null;if("between"==this.C)a=new E(me(this,this.value[0]),me(this,this.value[1]),!1,!1);else{if("in"==this.C)return a=this.value.map(function(a){return new E(a,a,!1,!1)}),new Bd(this.Va?Ad(a):a);a=me(this,this.value);a="eq"==this.C?new E(a,a,!1,!1):"gte"==this.C?new E(a,F,!1,!1):"gt"==this.C?new E(a,F,!0,!1):"lte"==this.C?new E(F,a,!1,!1):new E(F,a,!1,!0)}return new Bd(this.Va?td(a):[a])};function me(a,b){return 2==a.J.I()?b.getTime():b};function ne(a){this.ba=a;this.Zc=this.Ga=null}function oe(a,b){null===a.Ga&&null!=a.w&&(a.Ga=pe(a.w));return a.Ga.get(b)||null}function pe(a){var b=x();ge(a,function(a){b.set(a.W(),a)});return b}function re(a,b){b.w&&(a.w=b.w.Pb());a.Zc=b}ne.prototype.bind=function(){return this};function se(a,b){var c=a.w;null!=c&&ge(c,function(a){a instanceof je&&a.bind(b)})};function te(a){ne.call(this,a)}r(te,ne);function ue(a){var b="";a.forEach(function(c,d){b+=c.J.j()+" ";b+=1==c.sb?"ASC":"DESC";d<a.length-1&&(b+=", ")});return b}te.prototype.da=function(){return A(this.from)};te.prototype.clone=function(){var a=new te(this.ba);re(a,this);this.f&&(a.f=this.f.slice());this.from&&(a.from=this.from.slice());a.X=this.X;a.L=this.L;this.N&&(a.N=this.N.slice());this.la&&(a.la=this.la.slice());this.Vb&&(a.Vb=this.Vb);this.bc&&(a.bc=this.bc);a.cb=this.cb;return a};
	te.prototype.bind=function(a){te.hb.bind.call(this,a);null!=this.Vb&&(this.X=a[this.Vb.Ca()]);null!=this.bc&&(this.L=a[this.bc.Ca()]);se(this,a);return this};function ve(a,b){this.Ha=a;this.aa=b}ve.prototype.ab=g("Ha");ve.prototype.da=g("aa");function we(a){var b=A();a.forEach(function(a){a.da().forEach(b.add.bind(b))});return b};function xe(a,b){this.global=a;this.Na=a.b(pc);this.vd=b.map(function(a){return a.context});this.jf=b.map(function(a){return a.ke});this.Od=we(this.jf);this.ye=ye(this);this.fb=fb()}function ye(a){return a.vd.some(function(a){return!(a instanceof te)})?1:0}m=xe.prototype;
	m.exec=function(){function a(){var f=d.shift();if(f){var h=e[c.length];return f.ab().exec(b,h).then(function(b){c.push(b[0]);return a()})}return v()}var b=0==this.ye?void 0:new od(this.global,this.Od),c=[],d=this.jf.slice(),e=this.vd;return a().then(function(){this.ja=this.Na.Hb(this.ye,C(this.Od),b);return this.ja.ka()}.bind(this)).then(function(){this.he(c);return c}.bind(this),function(a){null!=b&&b.Mb();throw a;})};m.I=g("ye");m.da=g("Od");m.Rb=g("fb");m.W=function(){return ka(this)};m.he=aa();
	m.Y=function(){var a=null;null!=this.ja&&(a=this.ja.Y());return null===a?new z(!1,0,0,0,0):a};function ze(a,b){xe.call(this,a,b);this.Lb=a.b(uc)}r(ze,xe);ze.prototype.getPriority=l(0);ze.prototype.he=function(a){this.vd.forEach(function(b,c){Ae(this.Lb,b,a[c])},this)};function Be(a,b){this.c=a;this.Lb=a.b(uc);this.Ia=a.b(tc);this.kd=new Lc(a);this.ib=b;var c=a.b(vc),d=this.ib.map(function(a){return c.table(a.getName())});this.aa=A(d);this.fb=fb()}m=Be.prototype;m.exec=function(){this.kd.update(this.ib);this.Pc();return v()};m.I=l(1);m.da=g("aa");m.Rb=g("fb");m.W=function(){return ka(this)};m.getPriority=l(1);m.Pc=function(){var a=Ce(this.Lb,this.aa);0!=a.length&&(a=new ze(this.c,a),De(this.Ia,a))};function Ee(a){this.c=a;this.Na=a.b(pc);this.Ia=a.b(tc)}Ee.prototype.fe=function(a){a=new Be(this.c,a);De(this.Ia,a)};function L(a,b){this.Ta=a;this.i=b;this.Ya=x()}q("lf.backstore.FirebaseRawBackStore",L);L.prototype.fd=g("i");L.prototype.gd=function(){throw new D(351);};function Fe(a,b){var c=fb(),d=a;b.length&&(d=a.child(b));d.once("value",function(a){c.resolve(a.val())},function(a){c.reject(a)});return c.ha}function Ge(a,b,c){function d(a){a?e.reject(a):e.resolve()}c=c||!1;var e=fb();c?a.set(b,d):a.update(b,d);return e.ha}
	L.prototype.Ea=function(a){return Fe(this.i,"@rev/R").then(function(a){this.Ra=a;return Fe(this.i,"@table")}.bind(this)).then(function(b){var c=0,d;for(d in b)this.Ya.set(d,b[d]),b[d]>c&&(c=b[d]);a.pa().forEach(function(a){this.Ya.has(a.getName())||(b[a.getName()]=++c)},this);d=this.i.child("@table");return Ge(d,b)}.bind(this))};
	function He(a,b,c){var d=a.Ya.get(b);return null!=d?function(){var a={},b=fb();this.i.orderByChild("T").equalTo(d).once("value",function(d){d.forEach(function(b){var d=c(b.val());a[parseInt(b.key(),10)]=d});b.resolve(a)});return b.ha}.call(a).then(function(a){a["@rev"]={R:++this.Ra};return Ge(this.i,a)}.bind(a)):v()}L.prototype.wc=function(a){return He(this,a,l(null)).then(function(){this.Ya.delete(a);return Ge(this.i.child("@table/"+a),null,!0)}.bind(this))};L.prototype.dropTable=L.prototype.wc;
	L.prototype.tc=function(a,b,c){return He(this,a,function(a){var e=a.P;e[b]=c;return{R:this.Ra+1,T:a.T,P:e}}.bind(this))};L.prototype.addTableColumn=L.prototype.tc;L.prototype.xc=function(a,b){return He(this,a,function(a){var d=a.P;delete d[b];return{R:this.Ra+1,T:a.T,P:d}}.bind(this))};L.prototype.dropTableColumn=L.prototype.xc;L.prototype.Oc=function(a,b,c){return He(this,a,function(a){var e=a.P;e[c]=e[b];delete e[b];return{R:this.Ra+1,T:a.T,P:e}}.bind(this))};L.prototype.renameTableColumn=L.prototype.Oc;
	L.prototype.Ab=function(){throw new D(351);};L.prototype.createRow=L.prototype.Ab;L.prototype.Fc=g("Ta");L.prototype.getVersion=L.prototype.Fc;L.prototype.hc=function(a){var b=fb();a=this.Ya.get(a);this.i.orderByChild("T").equalTo(a).once("value",function(a){var d=[];a.forEach(function(a){d.push(a.val().P)});b.resolve(d)});return b.ha};L.prototype.dump=function(){var a={},b=$b(this.Ya).map(function(b){return this.hc(b).then(function(d){a[b]=d})}.bind(this));return eb(b).then(function(){return a})};
	L.prototype.dump=L.prototype.dump;function Ie(a,b,c){hc.call(this,b,c);this.i=a}r(Ie,hc);Ie.prototype.H=function(a){return this.i.Dc(a)};
	Ie.prototype.vc=function(){if(0==this.Ad)return this.S.resolve(),this.S.ha;var a=this.Qa.ib;if(0==a.size)this.S.resolve();else{var b=this.i.Ra+1;this.i.Ra=b;var c={"@rev":{R:b}};a.forEach(function(a,e){var f=this.i.Ya.get(e);a.wa.forEach(function(a,d){c[d]={R:b,T:f,P:a.m}});a.ma.forEach(function(a,d){c[d]={R:b,T:f,P:a[1].m}});a.xa.forEach(function(a,b){c[b]=null})},this);this.i.i.update(c,function(c){null===c?this.S.resolve():(this.i.Ra=b-1,c=y(a).map(function(a){return Je(this.i,a.getName())},this),
	eb(c).then(this.S.reject.bind(this.S),this.S.reject.bind(this.S)))}.bind(this))}return this.S.ha};function Ke(){this.Ba=x()}function Le(a,b){if(0==b.length)return y(a.Ba);var c=[];b.forEach(function(a){a=this.Ba.get(a)||null;null===a||c.push(a)},a);return c}Ke.prototype.getData=g("Ba");Ke.prototype.get=function(a){return v(Le(this,a))};function Me(a,b){b.forEach(function(a){this.Ba.set(a.id(),a)},a)}Ke.prototype.put=function(a){Me(this,a);return v()};function Ne(a,b){0==b.length||b.length==a.Ba.size?a.Ba.clear():b.forEach(function(a){this.Ba.delete(a)},a)}
	Ke.prototype.remove=function(a){Ne(this,a);return v()};function Oe(a){return 0==a.Ba.size?0:$b(a.Ba).reduce(function(a,c){return a>c?a:c},0)};function Pe(a,b){this.g=a;this.Ff=b;this.Nc=x();this.Ra=-1;this.M=x();this.Ya=x();this.Ld=null}m=Pe.prototype;
	m.Ea=function(a){this.i=this.Ff.child(this.g.name());var b=a||function(){return v()};return Fe(this.i,"@db/version").then(function(a){return null===a?Ge(this.i,Qe(this),!0).then(function(){var a=new L(0,this.i);return b(a)}.bind(this)).then(function(){return this.Ea()}.bind(this)):a==this.g.version()?Fe(this.i,"@rev/R").then(function(a){this.Ra=a;return Fe(this.i,"@table")}.bind(this)).then(function(a){for(var b in a)this.Ya.set(b,a[b]);a=this.g.pa().map(function(a){return Je(this,a.getName())},this);
	return eb(a)}.bind(this)).then(function(){Re(this);Se(this);return v()}.bind(this)):this.ie(a,b).then(function(){return this.Ea()}.bind(this))}.bind(this))};m.ie=function(a,b){var c=new L(a,this.i);return c.Ea(this.g).then(function(){return v()}.bind(this)).then(function(){return b(c)}).then(function(){var a=this.i.child("@db");return Ge(a,{version:this.g.version()},!0)}.bind(this))};
	function Se(a){a.i.off();a.i.on("child_removed",a.Bg.bind(a));a.Md&&(a.Md.off(),a.Nc.clear());a.Md=a.i.orderByChild("R").startAt(a.Ra+1);a.Md.on("value",a.fe.bind(a))}function Re(a){bc=y(a.M).map(function(a){return Oe(a)}).reduce(function(a,c){return a>c?a:c},0)+1}m.Bg=function(a){var b=a.val(),c=this.Nc.get(b.T)||null;null===c&&(c=A(),this.Nc.set(b.T,c));c.add(parseInt(a.key(),10))};
	m.fe=function(a){var b=a.child("@rev/R").val();null!=b&&b!=this.Ra&&(this.Ra=b,a=Te(this,a),a.forEach(function(a){var b=this.M.get(a.getName()),e=$b(a.xa);0<e.length&&Ne(b,e);var f=y(a.wa);a.ma.forEach(function(a){f.push(a[1])});Me(b,f)},this),0<a.length&&this.Jc(a),Se(this))};
	function Te(a,b){var c=A(),d=x();a.Ya.forEach(function(a,b){var h=this.M.get(b),k=new md(b);if(this.Nc.has(a)){var n=C(this.Nc.get(a));n.forEach(function(a){c.add(a)});Le(h,n).forEach(function(a){k.delete(a)})}d.set(a,k)}.bind(a));b.forEach(function(a){if("@rev"!=a.key()){var b=parseInt(a.key(),10);if(!c.has(b)){var h=a.val();a=d.get(h.T);var k=this.M.get(a.getName()),h=this.g.table(a.getName()).mb({id:b,value:h.P});k.getData().has(b)?a.modify([Le(k,[b])[0],h]):a.add(h)}}}.bind(a));return y(d).filter(function(a){return!a.md()})}
	function Je(a,b){var c=fb(),d=a.Ya.get(b),e=a.g.table(b);a.i.orderByChild("T").equalTo(d).once("value",function(a){var d=new Ke,k=[];a.forEach(function(a){k.push(e.mb({id:parseInt(a.key(),10),value:a.val().P}))});Me(d,k);this.M.set(b,d);c.resolve()}.bind(a));return c.ha}function Qe(a){var b={};b["@db"]={version:a.g.version()};b["@rev"]={R:1};a.Ra=1;b["@table"]={};a.g.pa().forEach(function(a,d){var e=a.getName();b["@table"][e]=d;this.M.set(e,new Ke);this.Ya.set(e,d)},a);return b}
	m.Hb=function(a,b,c){return new Ie(this,a,c)};m.Dc=function(a){var b=this.M.get(a)||null;if(null!==b)return b;throw new D(101,a);};m.close=aa();m.subscribe=ba("Ld");m.Jc=function(a){null!=this.Ld&&this.Ld(a)};function M(a,b,c,d){this.i=b;this.ja=c;this.Ta=a;this.Xc=d}q("lf.backstore.IndexedDBRawBackStore",M);M.prototype.fd=g("i");M.prototype.getRawDBInstance=M.prototype.fd;M.prototype.gd=g("ja");M.prototype.getRawTransaction=M.prototype.gd;M.prototype.wc=function(a){return new u(function(b,c){try{this.i.deleteObjectStore(a)}catch(d){c(d);return}b()},this)};M.prototype.dropTable=M.prototype.wc;
	function Ue(a,b,c,d){return new u(function(a,f){var h;try{var k=this.ja.objectStore(b);h=k.openCursor()}catch(n){f(n);return}h.onsuccess=function(){var b=h.result;b?(c(b),b.continue()):(d(k),a())};h.onerror=f},a)}function Ve(a){var b=null;return b=a instanceof ArrayBuffer?fc(a):a instanceof Date?a.getTime():a}
	function We(a,b,c){function d(a){var b=Gc(a.value),d=b.m,e;for(e in d){var B=cc(d[e]);c(B);d[e]=B.Ja()}a.update(b.Ja())}function e(a){var b=cc(a.value);c(b);a.update(b.Ja())}return Ue(a,b,a.Xc?d:e,aa())}M.prototype.tc=function(a,b,c){var d=Ve(c);return We(this,a,function(a){a.m[b]=d})};M.prototype.addTableColumn=M.prototype.tc;M.prototype.xc=function(a,b){return We(this,a,function(a){delete a.m[b]})};M.prototype.dropTableColumn=M.prototype.xc;
	M.prototype.Oc=function(a,b,c){return We(this,a,function(a){a.m[c]=a.m[b];delete a.m[b]})};M.prototype.renameTableColumn=M.prototype.Oc;function Xe(a,b){var c=[];return new u(function(a,e){var f;try{f=this.ja.objectStore(b).openCursor()}catch(h){e(h);return}f.onsuccess=function(){var b=f.result;if(b){if(this.Xc){var e=Gc(b.value).m,n;for(n in e)c.push(e[n])}else c.push(b.value);b.continue()}else a(c)}.bind(this);f.onerror=e},a)}M.prototype.Ab=function(a){var b={},c;for(c in a)b[c]=Ve(a[c]);return dc(b)};
	M.prototype.createRow=M.prototype.Ab;M.prototype.Fc=g("Ta");M.prototype.getVersion=M.prototype.Fc;M.prototype.dump=function(){for(var a=this.i.objectStoreNames,b=[],c=0;c<a.length;++c){var d=a.item(c);b.push(this.hc(d))}return eb(b).then(function(b){var c={};b.forEach(function(b,d){c[a.item(d)]=b});return c})};M.prototype.dump=M.prototype.dump;M.prototype.hc=function(a){return Xe(this,a).then(function(a){return a.map(function(a){return a.value})})};function Ye(a,b){this.Z=a;this.Ib=b}Ye.prototype.get=function(a){if(0==a.length)return null!=this.Z.getAll?Ze(this):$e(this);a=a.map(function(a){return new u(function(c,d){var e;try{e=this.Z.get(a)}catch(f){d(f);return}e.onerror=d;e.onsuccess=function(a){c(this.Ib(a.target.result))}.bind(this)},this)},this);return eb(a)};
	function $e(a){return new u(function(a,c){var d=[],e;try{e=this.Z.openCursor()}catch(f){c(f);return}e.onerror=c;e.onsuccess=function(){var c=e.result;c?(d.push(this.Ib(c.value)),c.continue()):a(d)}.bind(this)},a)}function Ze(a){return new u(function(a,c){var d;try{d=this.Z.getAll()}catch(e){c(e);return}d.onerror=c;d.onsuccess=function(){var c=d.result.map(function(a){return this.Ib(a)},this);a(c)}.bind(this)},a)}
	Ye.prototype.Wb=function(a){return new u(function(b,c){var d;try{d=a()}catch(e){c(e);return}d.onsuccess=b;d.onerror=c},this)};Ye.prototype.put=function(a){if(0==a.length)return v();a=a.map(function(a){return this.Wb(function(){return this.Z.put(a.Ja())}.bind(this))},this);return eb(a)};
	Ye.prototype.remove=function(a){return new u(function(b,c){var d=this.Z.count();d.onsuccess=function(d){if(0==a.length||d.target.result==a.length)return this.Wb(function(){return this.Z.clear()}.bind(this)).then(b,c);d=a.map(function(a){return this.Wb(function(){return this.Z.delete(a)}.bind(this))},this);eb(d).then(b,c)}.bind(this);d.onerror=c},this)};function af(a,b,c,d,e){hc.call(this,c,e);this.c=a;this.ja=b;this.Xc=d;this.ja.oncomplete=this.S.resolve.bind(this.S);this.ja.onabort=this.S.reject.bind(this.S)}r(af,hc);af.prototype.H=function(a,b,c){return this.Xc?(c=null!=c?c:0,a=this.ja.objectStore(a),new Hc(a,b,0==c?qa(Jc,this.c):Kc)):new Ye(this.ja.objectStore(a),b)};af.prototype.vc=function(){return this.S.ha};function bf(a,b){this.c=a;this.g=b;this.Id=b.kf().Vf||!1}m=bf.prototype;
	m.Ea=function(a){var b=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;if(null==b)throw new D(352);var c=a||function(){return v()};return new u(function(a,e){var f;try{f=b.open(this.g.name(),this.g.version())}catch(h){e(h);return}f.onerror=function(a){a=a.target.error;e(new D(361,a.name,a.message))};f.onupgradeneeded=function(a){cf(this,c,a).then(aa(),e)}.bind(this);f.onsuccess=function(b){this.i=b.target.result;this.re().then(function(b){bc=b+1;a(this.i)}.bind(this))}.bind(this)},
	this)};function cf(a,b,c){var d=c.target.result;c=new M(c.oldVersion,d,c.target.transaction,a.Id);df(d);a.g.pa().forEach(qa(a.Of,d),a);return b(c)}function df(a){for(var b=[],c=0;c<a.objectStoreNames.length;++c){var d=a.objectStoreNames.item(c);-1!=d.indexOf(".")&&b.push(d)}b.forEach(function(b){try{a.deleteObjectStore(b)}catch(c){}})}
	m.Of=function(a,b){a.objectStoreNames.contains(b.getName())||a.createObjectStore(b.getName(),{keyPath:"id"});b.Fb()&&(b.Da().forEach(function(b){ef(a,b.j())},this),ef(a,ff(b)))};function ef(a,b){a.objectStoreNames.contains(b)||a.createObjectStore(b,{keyPath:"id"})}m.Hb=function(a,b,c){b=this.i.transaction(gf(b),0==a?"readonly":"readwrite");return new af(this.c,b,a,this.Id,c)};
	function gf(a){var b=A();a.forEach(function(a){b.add(a.getName());a.Fb()&&(a.Da().forEach(function(a){b.add(a.j())}),b.add(ff(a)))});return C(b)}
	m.re=function(a){function b(){if(0==d.length)return v();var a=d.shift();return c(a).then(b)}function c(b){return new u(function(c,d){var O;try{O=(a||e.transaction([b])).objectStore(b).openCursor(null,"prev")}catch(ea){d(ea);return}O.onsuccess=function(a){(a=a.target.result)&&(f=Math.max(f,h(a)));c(f)};O.onerror=function(){c(f)}})}var d=this.g.pa().map(function(a){return a.getName()}),e=this.i,f=0,h=function(a){return this.Id?(a=Gc(a.value),Object.keys(a.m).reduce(function(a,b){return Math.max(a,b)},
	0)):a.key}.bind(this);return new u(function(a){b().then(function(){a(f)})})};m.close=function(){this.i.close()};m.Dc=function(){throw new D(511);};m.subscribe=aa();m.Jc=aa();function hf(a,b,c){hc.call(this,b,c);this.Z=a;0==b&&this.S.resolve()}r(hf,hc);hf.prototype.H=function(a){return this.Z.Dc(a)};hf.prototype.vc=function(){this.S.resolve();return this.S.ha};function jf(a){this.g=a;this.M=x()}m=jf.prototype;m.Ea=function(){this.g.pa().forEach(this.ig,this);return v()};m.Dc=function(a){var b=this.M.get(a)||null;if(null===b)throw new D(101,a);return b};m.Hb=function(a,b,c){return new hf(this,a,c)};function kf(a,b){if(!a.M.has(b)){var c=new Ke;a.M.set(b,c)}}m.ig=function(a){kf(this,a.getName());a.Fb()&&(a.Da().forEach(function(a){kf(this,a.j())},this),kf(this,ff(a)))};m.close=aa();m.subscribe=aa();m.Jc=aa();function mf(a){jf.call(this,a);this.sd=null}r(mf,jf);mf.prototype.subscribe=function(a){null===this.sd&&(this.sd=a)};mf.prototype.Jc=function(a){null===this.sd||this.sd(a)};function nf(a,b,c){this.ja=a;this.A='"'+b+'"';this.Ib=c}nf.prototype.get=function(a){var b=this.Ib;return of(this.ja,"SELECT id, value FROM "+this.A+" "+(0==a.length?"":"WHERE id IN ("+a.join(",")+")"),[],function(a){for(var d=a.rows.length,e=Array(d),f=0;f<d;++f)e[f]=b({id:a.rows.item(f).id,value:JSON.parse(a.rows.item(f).value)});return e})};
	nf.prototype.put=function(a){if(0==a.length)return v();var b="INSERT OR REPLACE INTO "+this.A+"(id, value) VALUES (?, ?)";a.forEach(function(a){of(this.ja,b,[a.id(),JSON.stringify(a.m)])},this);return v()};nf.prototype.remove=function(a){of(this.ja,"DELETE FROM "+this.A+" "+(0==a.length?"":"WHERE id IN ("+a.join(",")+")"),[]);return v()};function pf(a,b,c){hc.call(this,b,c);this.i=a;this.M=x();this.Pd=[]}r(pf,hc);function qf(a){return a.replace(".","__d__").replace("#","__s__")}pf.prototype.H=function(a,b){var c=this.M.get(a)||null;null===c&&(c=new nf(this,qf(a),b),this.M.set(a,c));return c};function of(a,b,c,d){var e=fb();a.Pd.push({Pg:b,Fg:c,transform:d,S:e});return e.ha}
	pf.prototype.vc=function(){var a=null,b=this.S.reject.bind(this.S),c=function(a,b){this.S.reject(b)}.bind(this),d=[],e=function(b,h){if(null!==a){var k=h;null!=a.transform&&null!=h&&(k=a.transform(h));d.push(k);a.S.resolve(k)}0<this.Pd.length?(a=k=this.Pd.shift(),b.executeSql(k.Pg,k.Fg,e,c)):this.S.resolve(d)}.bind(this);0==this.Ad?this.i.readTransaction(e,b):this.i.transaction(e,b);return this.S.ha};function N(a,b,c){this.i=c;this.c=a;this.Ta=b}q("lf.backstore.WebSqlRawBackStore",N);N.prototype.fd=g("i");N.prototype.getRawDBInstance=N.prototype.fd;N.prototype.gd=function(){throw new D(356);};N.prototype.getRawTransaction=N.prototype.gd;function rf(a){return new pf(a.i,1,new od(a.c,A()))}N.prototype.wc=function(a){var b=rf(this);of(b,"DROP TABLE "+a,[]);return b.ka()};N.prototype.dropTable=N.prototype.wc;
	N.prototype.hc=function(a){var b=rf(this);of(b,"SELECT id, value FROM "+a,[]);return b.ka().then(function(a){for(var b=a[0].rows.length,e=Array(b),f=0;f<b;++f)e[f]={id:a[0].rows.item(f).id,value:JSON.parse(a[0].rows.item(f).value)};return v(e)})};function sf(a,b,c){var d=rf(a),e="UPDATE "+b+" SET value=? WHERE id=?";return a.hc(b).then(function(a){a.forEach(function(a){a=c(a);of(d,e,[JSON.stringify(a.value),a.id])});return d.ka()})}
	N.prototype.tc=function(a,b,c){var d=Ve(c);return sf(this,a,function(a){a.value[b]=d;return a})};N.prototype.addTableColumn=N.prototype.tc;N.prototype.xc=function(a,b){return sf(this,a,function(a){delete a.value[b];return a})};N.prototype.dropTableColumn=N.prototype.xc;N.prototype.Oc=function(a,b,c){return sf(this,a,function(a){a.value[c]=a.value[b];delete a.value[b];return a})};N.prototype.renameTableColumn=N.prototype.Oc;N.prototype.Ab=function(a){var b={},c;for(c in a)b[c]=Ve(a[c]);return dc(b)};
	N.prototype.createRow=N.prototype.Ab;N.prototype.Fc=g("Ta");N.prototype.getVersion=N.prototype.Fc;function tf(a){of(a,'SELECT tbl_name FROM sqlite_master WHERE type="table"',[],function(a){for(var c=Array(a.rows.length),d=0;d<c.length;++d)c[d]=a.rows.item(d).tbl_name;return c})}
	N.prototype.dump=function(){var a=fb(),b=rf(this);tf(b);var c={};b.ka().then(function(b){b=b[0].filter(function(a){return"__lf_ver"!=a&&"__WebKitDatabaseInfoTable__"!=a}).map(function(a){return this.hc(a).then(function(b){c[a]=b})},this);eb(b).then(function(){a.resolve(c)})}.bind(this));return a.ha};N.prototype.dump=N.prototype.dump;function uf(a,b,c){this.c=a;this.g=b;this.Og=c||1}m=uf.prototype;m.Ea=function(a){if(null==window.openDatabase)throw new D(353);var b=a||function(){return v()};return new u(function(a,d){var e=window.openDatabase(this.g.name(),"",this.g.name(),this.Og);if(null!=e)this.i=e,vf(this,b).then(function(){this.re().then(a,d)}.bind(this),function(a){if(a instanceof D)throw a;throw new D(354,a.message);});else throw new D(354);},this)};
	function vf(a,b){var c=fb(),d=new pf(a.i,1,new od(a.c,A()));of(d,"CREATE TABLE IF NOT EXISTS __lf_ver(id INTEGER PRIMARY KEY, v INTEGER)",[]);of(d,"SELECT v FROM __lf_ver WHERE id = 0",[]);d.ka().then(function(a){var d=0;a[1].rows.length&&(d=a[1].rows.item(0).v);d<this.g.version()?this.ie(b,d).then(c.resolve.bind(c)):d>this.g.version()?c.reject(new D(108)):c.resolve()}.bind(a),c.reject.bind(c));return c.ha}m.Hb=function(a,b,c){if(null!=this.i)return new pf(this.i,a,c);throw new D(2);};m.close=aa();
	m.Dc=function(){throw new D(512);};m.subscribe=function(){throw new D(355);};m.Jc=function(){throw new D(355);};m.ie=function(a,b){return wf(this).then(function(){return a(new N(this.c,b,this.i))}.bind(this))};
	function wf(a){var b=a.g.pa(),c=new pf(a.i,1,new od(a.c,A())),d=new pf(a.i,1,new od(a.c,A()));of(c,"INSERT OR REPLACE INTO __lf_ver VALUES (0, ?)",[a.g.version()]);tf(c);return c.ka().then(function(a){var c=a[1];c.filter(function(a){return-1!=a.indexOf("__d__")}).forEach(function(a){of(d,"DROP TABLE "+('"'+a+'"'),[])});var h=[],k=[],n=[];b.map(function(a){-1==c.indexOf(a.getName())&&h.push(a.getName());a.Fb&&(a.Da().forEach(function(a){a=qf(a.j());h.push(a);k.push(a)}),a=qf(ff(a)),h.push(a),n.push(a))});
	h.forEach(function(a){of(d,"CREATE TABLE "+('"'+a+'"')+"(id INTEGER PRIMARY KEY, value TEXT)",[])});return d.ka()})}m.re=function(){var a=0,b=fb(),c=function(b){var c=new pf(this.i,0);of(c,"SELECT MAX(id) FROM "+('"'+b+'"'),[]);return c.ka().then(function(b){b=b[0].rows.item(0)["MAX(id)"];a=Math.max(b,a)})}.bind(this),d=this.g.pa().map(function(a){return c(a.getName())});eb(d).then(function(){bc=a+1;b.resolve()},function(a){b.reject(a)});return b.ha};function xf(a){this.l=x();this.cc=x();a.pa().forEach(function(a){this.cc.set(a.getName(),A())},this)}m=xf.prototype;m.set=function(a,b){this.l.set(b.id(),b);this.cc.get(a).add(b.id())};m.Zb=function(a,b){var c=this.cc.get(a);b.forEach(function(a){this.l.set(a.id(),a);c.add(a.id())},this)};m.get=function(a){return this.l.get(a)||null};function yf(a,b){return b.map(function(a){return this.get(a)},a)}
	m.Ua=function(a,b,c){var d=[],e=Math.min(b,c),f=Math.max(b,c);a=this.cc.get(a);if(a.size<f-e)a.forEach(function(a){a>=e&&a<=f&&(a=this.l.get(a),d.push(a))},this);else for(b=e;b<=f;++b)a.has(b)&&(c=this.l.get(b),d.push(c));return d};m.remove=function(a,b){this.l.delete(b);this.cc.get(a).delete(b)};m.Cc=function(a){return null!=a?this.cc.get(a).size:this.l.size};m.clear=function(){this.l.clear();this.cc.clear()};function zf(a,b,c){var d=0,e=a.length;for(c=c||Af;d<e;){var f=d+e>>1;0>c(a[f],b)?d=f+1:e=f}return d==e&&a[d]==b?d:~d}function Af(a,b){return a-b}function Bf(a,b,c){c=zf(a,b,c);return 0>c?(a.splice(-(c+1),0,b),!0):!1};function Cf(a,b,c,d){a=b?a.reverse():a;if(null==c&&null==d)return a;c=Math.min(p(c)?c:a.length,a.length);if(0==c)return[];d=Math.min(d||0,a.length);return a.slice(d,d+c)};function Df(){this.ia=0;this.Ic=null}Df.prototype.add=function(a,b){this.ia+=b;this.Ic=null===this.Ic?a:a>this.Ic?a:this.Ic};Df.prototype.remove=function(a,b){this.ia-=b};Df.prototype.clear=function(){this.ia=0};function Ef(a,b){a.clear();b.forEach(function(a){this.ia+=a.ia},a)};function Ff(a,b,c,d){this.A=a;this.$=b;this.Af=c;this.za=new Df;if(d){a=511;a*=a*a;if(d.length>=a)throw new D(6,a);d=Gf(this,d);this.ua=d=Hf(d)}else this.clear()}var If=[];m=Ff.prototype;m.getName=g("A");m.toString=function(){return this.ua.toString()};m.add=function(a,b){this.ua=this.ua.Db(a,b)};m.set=function(a,b){this.ua=this.ua.Db(a,b,!0)};m.remove=function(a,b){this.ua=this.ua.remove(a,b)};m.get=function(a){return this.ua.get(a)};
	m.ad=function(a){if(null==a)return this.Y().ia;if(a instanceof E){if(ud(a))return this.Y().ia;if(yd(a))return this.get(a.from).length}return this.Ua([a]).length};m.Y=g("za");m.Wd=function(a,b,c,d){c=Array(a);this.ua.fill({offset:b?this.za.ia-a-d:d,count:a,ue:0},c);return b?c.reverse():c};
	m.Ua=function(a,b,c,d){var e=Jf(this.ua).a[0];if(!p(e)||0==c)return If;b=b||!1;c=null!=c?Math.min(c,this.za.ia):this.za.ia;d=d||0;var f=Math.min(Math.max(this.za.ia-d,0),c);if(0==f)return If;if(!p(a)||1==a.length&&a[0]instanceof E&&ud(a[0]))return this.Wd(f,b,c,d);a=this.$.wf(a);var h=Array(b?this.za.ia:f),k={count:0,X:h.length,reverse:b,L:d},n=1<this.lb().ae();a.forEach(function(a){for(var b=this.$.wd(a),b=this.$.Zd(a)?e:b[0],b=this.ua.bg(b),c=0;null!=b&&k.count<k.X;){if(n){for(var d=b,f=a,ec=k,
	Db=h,Uc=d.u.lb(),qe=-1,Ma=0;Ma<d.a.length;++Ma)if(Uc.Eb(d.a[Ma],f)){qe=Ma;break}if(-1!=qe)for(Ma=qe;Ma<d.a.length&&ec.count<ec.X;++Ma)Uc.Eb(d.a[Ma],f)&&Kf(d,ec,Db,Ma)}else b.Ua(a,k,h);0!=k.L||b.nd(a)?c=0:c++;b=2==c?null:b.next()}},this);h.length>k.count&&h.splice(k.count,h.length-k.count);return b?Cf(h,b,c,d):h};m.clear=function(){this.ua=Lf(this);this.za.clear()};m.Oa=function(a){return this.ua.Oa(a)};m.min=function(){return this.Kb(this.$.min.bind(this.$))};m.max=function(){return this.Kb(this.$.max.bind(this.$))};
	function Mf(a,b,c){if(!a.$.Qd(b.a[c]))if(1<b.a[c].length){if(null===b.a[c][0])return null}else return null;return[b.a[c],a.Af?[b.B[c]]:b.B[c]]}m.Kb=function(a){var b;a:{b=Jf(this.ua);var c=0;do if(c>=b.a.length)b=b.ya,c=0;else{var d=Mf(this,b,c);if(null!==d){b=d;break a}c++}while(null!==b);b=null}a:{c=Nf(this.ua);d=c.a.length-1;do if(0>d)c=c.tb,d=0;else{var e=Mf(this,c,d);if(null!==e){c=e;break a}d--}while(null!==c);c=null}return null===b||null===c?null:1==a(b[0],c[0])?b:c};m.La=g("Af");m.lb=g("$");
	m.Pa=function(a,b){return null!=a?0==this.$.compare(a,b):!1};m.Ja=function(){for(var a=[],b=Jf(this.ua);b;)a.push(new ac(b.sa,[b.a,b.B])),b=b.ya;return a};function Of(a,b,c,d){a=new Ff(b,a,c);d=Pf(d,a);a.ua=d;return a}function Qf(a,b){this.sa=a;this.u=b;this.ob=0;this.ya=this.tb=this.F=null;this.a=[];this.B=[];this.h=[];this.bg=1==b.lb().ae()?this.Pe:this.Oe}function Lf(a){return new Qf(bc++,a)}function P(a){return 0==a.ob}m=Qf.prototype;m.next=g("ya");
	function Rf(a){function b(a){return null!=a?a.sa.toString():"_"}var c=a.sa+"["+a.a.join("|")+"]",d=a.h.map(function(a){return a.sa}).join("|"),e=a.B.join("/"),f=b(a.tb)+"{",f=P(a)?f+e:f+d,f=f+"}"+b(a.F);a.ya&&(a=Rf(a.ya),c=c+"  "+a[0],f=f+"  "+a[1]);return[c,f]}m.toString=function(){var a="",b=Rf(this),a=a+(b[0]+"\n"+b[1]+"\n");this.h.length&&(a+=this.h[0].toString());return a};function Jf(a){return P(a)?a:Jf(a.h[0])}function Nf(a){return P(a)?a:Nf(a.h[a.h.length-1])}
	function Sf(a,b){b&&(b.tb=a);a&&(a.ya=b)}function Gf(a,b){for(var c=b.length,d=0,e=Lf(a),f=e;0<c;){var h=768<=c?511:257<=c&&511>=c?c:257,k=b.slice(d,d+h);e.a=k.map(function(a){return a.key});e.B=k.map(function(a){return a.value});d+=h;c-=h;0<c&&(h=Lf(e.u),Sf(e,h),e=h)}return f}function Tf(a){var b=a[0],c=Lf(b.u);c.ob=b.ob+1;c.h=a;for(b=0;b<a.length;++b)a[b].F=c,0<b&&c.a.push(a[b].a[0]);return c}
	function Hf(a){var b=a,c=[];do c.push(b),b=b.ya;while(b);if(512>=c.length)b=Tf(c);else{var d=c.length,e=0,b=Lf(a.u);for(b.ob=a.ob+2;0<d;){a=768<=d?511:257<=d&&511>=d?d:257;var f=c.slice(e,e+a),h=Tf(f);h.F=b;b.h.length&&(b.a.push(f[0].a[0]),Sf(b.h[b.h.length-1],h));b.h.push(h);e+=a;d-=a}}return b}m.get=function(a){var b=Uf(this,a);if(P(this)){var c=If;this.u.Pa(this.a[b],a)&&(c=c.concat(this.B[b]));return c}b=this.u.Pa(this.a[b],a)?b+1:b;return this.h[b].get(a)};
	m.Oa=function(a){var b=Uf(this,a);return this.u.Pa(this.a[b],a)?!0:P(this)?!1:this.h[b].Oa(a)};m.remove=function(a,b){Vf(this,a,-1,b);if(null===this.F){var c=this;1==this.h.length&&(c=this.h[0],c.F=null);return c}return this};function Wf(a){return P(a)?a.a[0]:Wf(a.h[0])}function Xf(a){a.a=[];for(var b=1;b<a.h.length;++b)a.a.push(Wf(a.h[b]))}
	function Vf(a,b,c,d){var e=Uf(a,b),f=P(a);if(!f){var h=a.u.Pa(a.a[e],b)?e+1:e;if(Vf(a.h[h],b,h,d))Xf(a);else return!1}else if(!a.u.Pa(a.a[e],b))return!1;if(a.a.length>e&&a.u.Pa(a.a[e],b)){if(p(d)&&!a.u.La()&&f&&(h=a.B[e],d=zf(h,d,void 0),0>d?d=!1:(h.splice(d,1),d=!0),d&&a.u.Y().remove(b,1),a.B[e].length))return!1;a.a.splice(e,1);f&&(f=a.u.La()?1:a.B[e].length,a.B.splice(e,1),a.u.Y().remove(b,f))}if(256>a.a.length&&null!==a.F){a:{b=null;if(a.ya&&256<a.ya.a.length)b=a.ya,e=d=0,f=a.a.length+1;else if(a.tb&&
	256<a.tb.a.length)b=a.tb,d=a.tb.a.length-1,e=P(a)?d:d+1,f=0;else{b=!1;break a}a.a.splice(f,0,b.a[d]);b.a.splice(d,1);d=P(a)?a.B:a.h;h=null;P(a)?h=b.B:(h=b.h,h[e].F=a);d.splice(f,0,h[e]);h.splice(e,1);P(b)||(Xf(b),Xf(a));b=!0}b||Yf(a,c)}return!0}
	function Yf(a,b){var c,d,e;a.ya&&511>a.ya.a.length?(c=a.ya,e=d=0):a.tb&&(c=a.tb,d=c.a.length,e=P(c)?c.B.length:c.h.length);d=[d,0].concat(a.a);Array.prototype.splice.apply(c.a,d);d=null;P(a)?d=a.B:(d=a.h,d.forEach(function(a){a.F=c}));d=[e,0].concat(d);Array.prototype.splice.apply(P(c)?c.B:c.h,d);Sf(a.tb,a.ya);P(c)||Xf(c);-1!=b&&(a.F.a.splice(b,1),a.F.h.splice(b,1))}
	m.Db=function(a,b,c){var d=Uf(this,a);if(P(this)){if(this.u.Pa(this.a[d],a)){if(c)this.u.Y().remove(a,this.u.La()?1:this.B[d].length),this.B[d]=this.u.La()?b:[b];else{if(this.u.La())throw new D(201);if(!Bf(this.B[d],b))throw new D(109);}this.u.Y().add(a,1);return this}this.a.splice(d,0,a);this.B.splice(d,0,this.u.La()?b:[b]);this.u.Y().add(a,1);512==this.a.length?(d=Lf(this.u),a=Lf(this.u),a.ob=1,a.a=[this.a[256]],a.h=[this,d],a.F=this.F,this.F=a,d.a=this.a.splice(256),d.B=this.B.splice(256),d.F=
	a,Sf(d,this.ya),Sf(this,d),d=a):d=this;return d}d=this.u.Pa(this.a[d],a)?d+1:d;a=this.h[d].Db(a,b,c);P(a)||1!=a.a.length||(this.a.splice(d,0,a.a[0]),a.h[1].F=this,a.h[0].F=this,this.h.splice(d,1,a.h[1]),this.h.splice(d,0,a.h[0]));return 512==this.a.length?Zf(this):this};function Zf(a){var b=Lf(a.u),c=Lf(a.u);b.F=a.F;b.ob=a.ob+1;b.a=[a.a[256]];b.h=[a,c];a.a.splice(256,1);c.F=b;c.ob=a.ob;c.a=a.a.splice(256);c.h=a.h.splice(257);c.h.forEach(function(a){a.F=c});a.F=b;Sf(c,a.ya);Sf(a,c);return b}
	function Uf(a,b){for(var c=0,d=a.a.length,e=a.u.lb();c<d;){var f=c+d>>1;-1==e.compare(a.a[f],b)?c=f+1:d=f}return c}m.Pe=function(a){if(!P(this)){var b=Uf(this,a);this.u.Pa(this.a[b],a)&&b++;return this.h[b].Pe(a)}return this};m.Oe=function(a){if(!P(this)){var b=Uf(this,a);this.u.Pa(this.a[b],a)&&(a.some(function(a){return a==F})||b++);return this.h[b].Oe(a)}return this};
	m.Ua=function(a,b,c){function d(a){return a[0]?a[1]?0:1:-1}var e=this.u.lb(),f=0,h=this.a.length-1,k=this.a,n=d(e.zb(k[f],a)),B=d(e.zb(k[h],a));if(1!=n&&(-1!=n||-1!=B)){var O=function(a,b){var c=a+b>>1;return c==a?c+1:c},ea=function(b,c,f){if(b>=c)return 0==f?c:-1;var h=d(e.zb(k[b],a));if(0==h)return b;if(1==h)return-1;h=O(b,c);if(h==c)return 0==f?c:-1;var n=d(e.zb(k[h],a));return 0==n?ea(b,h,n):-1==n?ea(h+1,c,f):ea(b+1,h,n)},Cb=function(b,c){if(b>=c)return b;var f=d(e.zb(k[c],a));if(0==f)return c;
	if(-1==f)return b;f=O(b,c);if(f==c)return b;var h=d(e.zb(k[f],a));return 0==h?Cb(f,c):1==h?Cb(b,f-1):-1};0!=n&&(f=ea(f+1,h,B));-1!=f&&(h=Cb(f,h),-1!=h&&h>=f&&$f(this,b,c,f,h+1))}};function Kf(a,b,c,d){if(a.u.La())!b.reverse&&b.L?b.L--:c[b.count++]=a.B[d];else for(var e=0;e<a.B[d].length&&b.count<c.length;++e)!b.reverse&&b.L?b.L--:c[b.count++]=a.B[d][e]}function $f(a,b,c,d,e){for(;d<e&&(b.reverse||!(b.count>=b.X));++d)Kf(a,b,c,d)}
	m.fill=function(a,b){if(P(this))for(var c=0;c<this.B.length&&0<a.count;++c)if(0<a.offset){if(a.offset-=this.u.La()?1:this.B[c].length,0>a.offset)for(var d=this.B[c].length+a.offset;d<this.B[c].length&&0<a.count;++d)b[a.ue++]=this.B[c][d],a.count--}else if(this.u.La())b[a.ue++]=this.B[c],a.count--;else for(d=0;d<this.B[c].length&&0<a.count;++d)b[a.ue++]=this.B[c][d],a.count--;else for(c=0;c<this.h.length&&0<a.count;++c)this.h[c].fill(a,b)};
	function Pf(a,b){for(var c=b.Y(),d=a.map(function(a){var d=new Qf(a.id(),b);d.a=a.m[0];d.B=a.m[1];d.a.forEach(function(a,e){c.add(a,b.La()?1:d.B[e].length)});return d}),e=0;e<d.length-1;++e)Sf(d[e],d[e+1]);return 1<d.length?Hf(d[0]):d[0]}m.nd=function(a){return this.u.lb().nd(this.a[0],a)};function ag(a){this.$c=0==a?bg:cg;this.de=0==a?function(a){return null!=a?a.reverse():null}:function(a){return a||null};this.je=0==a?dg:eg}function cg(a,b){return a>b?1:a<b?-1:0}function bg(a,b){return cg(b,a)}function eg(a,b){return zd(a,b)}function dg(a,b){return zd(b,a)}m=ag.prototype;m.zb=function(a,b){var c=this.de(b),d=[c.from==F,c.o==F];if(!d[0]){var e=this.$c(a,c.from);d[0]=c.ea?1==e:-1!=e}d[1]||(e=this.$c(a,c.o),d[1]=c.oa?-1==e:1!=e);return d};m.compare=function(a,b){return this.$c(a,b)};
	m.min=function(a,b){return a<b?1:a==b?0:-1};m.max=function(a,b){return a>b?1:a==b?0:-1};m.Eb=function(a,b){var c=this.zb(a,b);return c[0]&&c[1]};m.nd=function(a,b){return this.Eb(a,b)};m.wf=function(a){return a.filter(function(a){return null!==a}).sort(function(a,c){return this.je(a,c)}.bind(this))};m.Zd=function(a){return this.de(a).from==F};m.wd=function(a){a=this.de(a);return[a.from,a.o]};m.Qd=function(a){return null!==a};m.ae=l(1);
	m.toString=function(){return this.compare==bg?"SimpleComparator_DESC":"SimpleComparator_ASC"};function gg(a){ag.call(this,a);this.$c=0==a?hg:ig}r(gg,ag);function ig(a,b){return null===a?null===b?0:-1:null===b?1:cg(a,b)}function hg(a,b){return ig(b,a)}gg.prototype.Eb=function(a,b){return null===a?ud(b):gg.hb.Eb.call(this,a,b)};gg.prototype.Kb=function(a,b){return null===a?null===b?0:-1:null===b?1:null};gg.prototype.min=function(a,b){var c=this.Kb(a,b);null===c&&(c=gg.hb.min.call(this,a,b));return c};
	gg.prototype.max=function(a,b){var c=this.Kb(a,b);null===c&&(c=gg.hb.max.call(this,a,b));return c};function jg(a){this.qa=a.map(function(a){return new ag(a)})}function kg(a,b,c,d){for(var e=0,f=0;f<a.qa.length&&0==e;++f)e=d(a.qa[f],b[f],c[f]);return e}m=jg.prototype;m.compare=function(a,b){return kg(this,a,b,function(a,b,e){return b==F||e==F?0:a.compare(b,e)})};m.min=function(a,b){return kg(this,a,b,function(a,b,e){return a.min(b,e)})};m.max=function(a,b){return kg(this,a,b,function(a,b,e){return a.max(b,e)})};
	m.zb=function(a,b){for(var c=[!0,!0],d=0;d<this.qa.length&&(c[0]||c[1]);++d){var e=this.qa[d].zb(a[d],b[d]);c[0]=c[0]&&e[0];c[1]=c[1]&&e[1]}return c};m.Eb=function(a,b){for(var c=!0,d=0;d<this.qa.length&&c;++d)c=this.qa[d].Eb(a[d],b[d]);return c};m.nd=function(a,b){return this.qa[0].Eb(a[0],b[0])};
	m.wf=function(a){var b=a.filter(function(a){return a.every(ga)});a=Array(this.qa.length);for(var c=0;c<a.length;c++)a[c]=b.map(function(a){return a[c]});a.forEach(function(a,b){a.sort(function(a,c){return this.qa[b].je(a,c)}.bind(this))},this);b=Array(b.length);for(c=0;c<b.length;c++)b[c]=a.map(function(a){return a[c]});return b.sort(function(a,b){for(var c=0,h=0;h<this.qa.length&&0==c;++h)c=this.qa[h].je(a[h],b[h]);return c}.bind(this))};m.Zd=function(a){return this.qa[0].Zd(a[0])};
	m.wd=function(a){var b=a.map(function(a,b){return this.qa[b].wd(a)[0]},this);a=a.map(function(a,b){return this.qa[b].wd(a)[1]},this);return[b,a]};m.Qd=function(a){return a.every(function(a,c){return this.qa[c].Qd(a)},this)};m.ae=function(){return this.qa.length};function lg(a){jg.call(this,a);this.qa=a.map(function(a){return new gg(a)})}r(lg,jg);function mg(a){if(1==a.f.length)return new ag(a.f[0].sb);var b=a.f.map(function(a){return a.sb});return a.f.some(function(a){return a.ba.kc()})?new lg(b):new jg(b)};function ng(a){this.fa=a;this.qb=A();this.Rc=new Df;this.za=new Df}m=ng.prototype;m.getName=function(){return this.fa.getName()};m.add=function(a,b){null===a?(this.qb.add(b),this.Rc.add(a,1)):this.fa.add(a,b)};m.set=function(a,b){null===a?(this.qb.clear(),this.Rc.clear(),this.add(a,b)):this.fa.set(a,b)};m.remove=function(a,b){null===a?b?(this.qb.delete(b),this.Rc.remove(a,1)):(this.qb.clear(),this.Rc.clear()):this.fa.remove(a,b)};m.get=function(a){return null===a?C(this.qb):this.fa.get(a)};m.ad=function(a){return this.fa.ad(a)};
	m.Y=function(){Ef(this.za,[this.fa.Y(),this.Rc]);return this.za};m.Ua=function(a,b,c,d){b=this.fa.Ua(a,b,c,d);return null!=a?b:b.concat(C(this.qb))};m.clear=function(){this.qb.clear();this.fa.clear()};m.Oa=function(a){return null===a?0!=this.qb.size:this.fa.Oa(a)};m.min=function(){return this.fa.min()};m.max=function(){return this.fa.max()};m.Ja=function(){return[new ac(-2,C(this.qb))].concat(this.fa.Ja())};m.lb=function(){return this.fa.lb()};
	function og(a,b){for(var c=-1,d=0;d<b.length;++d)if(-2==b[d].id()){c=d;break}if(-1==c)throw new D(102);var d=b[c].m,e=b.slice(0);e.splice(c,1);var c=a(e),f=new ng(c);d.forEach(function(a){f.qb.add(a)});return f}m.La=function(){return this.fa.La()};function pg(a){this.A=a;this.vb=A();this.$=new ag(1)}m=pg.prototype;m.getName=g("A");m.add=function(a){if("number"!=typeof a)throw new D(103);this.vb.add(a)};m.set=function(a,b){this.add(a,b)};m.remove=function(a){this.vb.delete(a)};m.get=function(a){return this.Oa(a)?[a]:[]};m.min=function(){return this.Kb(this.$.min.bind(this.$))};m.max=function(){return this.Kb(this.$.max.bind(this.$))};
	m.Kb=function(a){if(0==this.vb.size)return null;var b=C(this.vb).reduce(function(b,d){return null===b||1==a(d,b)?d:b},null);return[b,[b]]};m.ad=function(){return this.vb.size};m.Ua=function(a,b,c,d){var e=a||[xd()];a=C(this.vb).filter(function(a){return e.some(function(b){return this.$.Eb(a,b)},this)},this);return Cf(a,b,c,d)};m.clear=function(){this.vb.clear()};m.Oa=function(a){return this.vb.has(a)};m.Ja=function(){return[new ac(0,C(this.vb))]};m.lb=g("$");
	function qg(a,b){var c=new pg(a);b[0].m.forEach(function(a){c.add(a,a)});return c}m.La=l(!0);m.Y=function(){var a=new Df;a.ia=this.vb.size;return a};function rg(a){this.Na=a.b(pc);this.D=a.b(rc);this.V=a.b(qc)}rg.prototype.Ea=function(a){var b=a.pa(),c=function(){if(0==b.length)return v();var a=b.shift();return(a.Fb()?sg(this,a):tg(this,a)).then(c)}.bind(this);return c()};function tg(a,b){var c=a.Na.Hb(0,[b]),d=c.H(b.getName(),b.mb.bind(b),0).get([]).then(function(a){this.V.Zb(b.getName(),a);ug(this,b,a)}.bind(a));c.ka();return d}
	function ug(a,b,c){var d=a.D.oc.get(b.getName())||[];c.forEach(function(a){d.forEach(function(b){var c=a.pb(b.getName());b.add(c,a.id())})})}function sg(a,b){var c=a.Na.Hb(0,[b]),d=c.H(b.getName(),b.mb,0).get([]).then(function(a){this.V.Zb(b.getName(),a)}.bind(a)),e=b.Da().map(function(a){return vg(this,a,c)},a).concat(wg(a,b,c));c.ka();return eb(e.concat(d))}
	function vg(a,b,c){c=c.H(b.j(),cc,1);var d=mg(b);return c.get([]).then(function(a){if(0<a.length){if(xg(b)){var c=Of.bind(void 0,d,b.j(),b.Gc);a=og(c,a)}else a=Of(d,b.j(),b.Gc,a);this.D.set(b.pc,a)}}.bind(a))}function wg(a,b,c){return c.H(ff(b),cc,1).get([]).then(function(a){0<a.length&&(a=qg(ff(b),a),this.D.set(b.getName(),a))}.bind(a))};function yg(){this.Z=x();this.oc=x()}yg.prototype.Ea=function(a){a.pa().forEach(function(a){var c=[];this.oc.set(a.getName(),c);var d=ff(a);if(null===this.get(d)){var e=new pg(d);c.push(e);this.Z.set(d,e)}a.Da().forEach(function(a){var b;b=mg(a);b=new Ff(a.j(),b,a.Gc);b=xg(a)&&1==a.f.length?new ng(b):b;c.push(b);this.Z.set(a.j(),b)},this)},this);return v()};yg.prototype.get=function(a){return this.Z.get(a)||null};
	yg.prototype.set=function(a,b){var c=this.oc.get(a)||null;null===c&&(c=[],this.oc.set(a,c));for(var d=null,e=0;e<c.length;e++)if(c[e].getName()==b.getName()){d=e;break}null!==d&&0<c.length?c.splice(d,1,b):c.push(b);this.Z.set(b.getName(),b)};function zg(a,b){var c=[],d=null,e=null;ge(a,function(a){var h=b(a);null==a.getParent()?e=h:K(d,h);var k=a.getParent();null!==k&&J(k).length==J(d).length&&(k=c.indexOf(d),-1!=k&&c.splice(k,1));1<J(a).length&&c.push(h);d=null===a.h?c[c.length-1]:h});return e}function Ag(a){return Bg(a,function(a){return null===a.h})}
	function Cg(a){var b=a.getParent(),c=0;null!==b&&(c=J(b).indexOf(a),b.removeChild(a));var d=J(a).slice();d.forEach(function(d,f){a.removeChild(d);null===b||de(b,d,c+f)});return{parent:b,children:d}}function Dg(a,b){J(a).slice().forEach(function(c){a.removeChild(c);K(b,c)});K(a,b)}function Eg(a){var b=ce(a,0);Cg(a);Dg(b,a);return b}
	function Fg(a,b,c){var d=ce(a,0),e=J(d).slice();if(!e.some(function(a){return b(a)}))return a;Cg(a);e.forEach(function(e,h){if(b(e)){var k=c(a);ee(d,h);K(k,e);de(d,k,h)}});return d}function Gg(a,b,c,d){var e=a.getParent();null!==e&&(a=J(e).indexOf(a),ee(e,a),de(e,c,a));J(b).slice().forEach(function(a){b.removeChild(a);K(d,a)});return c}function Bg(a,b,c){function d(a){b(a)&&e.push(a);null!=c&&c(a)||J(a).forEach(d)}var e=[];d(a);return e}
	function Hg(a,b){var c=b||function(a){return a.toString()+"\n"},d="";ge(a,function(a){for(var b=0;b<be(a);b++)d+="-";d+=c(a)});return d};function Ig(a){he.call(this);this.rb=a;this.Va=!1}r(Ig,he);m=Ig.prototype;m.Pb=function(){return zg(this,function(a){if(a instanceof Ig){var b=new Ig(a.rb);b.Va=a.Va;a=a.W();b.sa=a;return b}return a.Pb()})};m.nb=function(a){var b=a||[];ge(this,function(a){a!=this&&a.nb(b)}.bind(this));a=A(b);return C(a)};m.s=function(a){var b=null!=a?a:A();ge(this,function(a){a!=this&&a.s(b)}.bind(this));return b};m.xd=function(a){this.Va!=a&&(this.Va=a,this.rb="and"==this.rb?"or":"and",J(this).forEach(function(b){return b.xd(a)}))};
	m.eval=function(a){var b=J(this).map(function(b){return b.eval(a)});return Jg(this,b)};function Jg(a,b){return"and"==a.rb?Id(b):Jd(b)}m.toString=function(){return"combined_pred_"+this.rb.toString()};m.xe=function(){if("or"==this.rb){var a=new Bd;J(this).forEach(function(b){b=b.xe().ra();a.add(b)});return a}return new Bd};m.od=function(){return"or"==this.rb?Kg(this):!1};
	function Kg(a){var b=null;return J(a).every(function(a){if(!(a instanceof je&&a.od()))return!1;null===b&&(b=a.J);return b.j()==a.J.j()})};function Lg(a,b,c){he.call(this);this.ga=a;this.na=b;this.C=c;this.ee=null;a=Zd();this.yc=$d(a,this.ga.I(),this.C);this.pg=a.Ze.get(this.ga.I())||null}r(Lg,he);m=Lg.prototype;m.Pb=function(){var a=new Lg(this.ga,this.na,this.C),b=this.W();a.sa=b;return a};m.nb=function(a){return null!=a?(a.push(this.ga),a.push(this.na),a):[this.ga,this.na]};m.s=function(a){a=null!=a?a:A();a.add(this.ga.H());a.add(this.na.H());return a};
	m.reverse=function(){var a=this.C;switch(this.C){case "gt":a="lt";break;case "lt":a="gt";break;case "gte":a="lte";break;case "lte":a="gte"}return new Lg(this.na,this.ga,a)};m.eval=function(a){var b=a.entries.filter(function(a){var b=H(a,this.ga);a=H(a,this.na);return this.yc(b,a)},this);return new G(b,a.s())};m.toString=function(){return"join_pred("+this.ga.j()+" "+this.C+" "+this.na.j()+")"};
	function Mg(a,b,c){var d=null,e=null;-1!=b.s().indexOf(Nd(a.ga.H()))?(d=b,e=c):(d=c,e=b);if(d.entries.length>e.entries.length){a:{b=a.ga;a.ga=a.na;a.na=b;b=a.C;switch(a.C){case "gt":b="lt";break;case "lt":b="gt";break;case "gte":b="lte";break;case "lte":b="gte";break;default:break a}a.C=b;a.yc=$d(Zd(),a.ga.I(),a.C)}return[e,d]}return[d,e]}function Ng(a){var b={};a.nb().forEach(function(a){b[a.getName()]=null});return b}
	function Og(a,b,c){null===a.ee&&(a.ee=Ng(a.na.H()));var d=new Ld(new ac(-1,a.ee),!1);return Pd(b,c,d,[Nd(a.na.H())])}
	function Pg(a,b,c,d){var e=[b,c];d||(e=Mg(a,b,c));b=e[0];c=e[1];var e=b,f=c,h=a.ga,k=a.na;d&&(e=c,f=b,h=a.na,k=a.ga);var n=new Xc,B=[];e.entries.forEach(function(a){var b=String(H(a,h));n.set(b,a)});var O=e.s(),ea=f.s();f.entries.forEach(function(a){var b=H(a,k),c=String(b);null!==b&&n.has(c)?n.get(c).forEach(function(b){b=Pd(a,ea,b,O);B.push(b)}):d&&B.push(Og(this,a,ea))}.bind(a));a=b.s().concat(c.s());return new G(B,a)}
	function Qg(a,b,c,d,e){function f(a,b){var c=new Ld(b,1<O.length),c=Pd(a,ea,c,O);B.push(c)}var h=d.fg.H(),k=b,n=c;-1!=b.s().indexOf(Nd(h))&&(k=c,n=b);var B=[],O=n.s(),ea=k.s();k.entries.forEach(function(a){var b=this.pg(H(a,d.yg)),b=d.index.get(b);0!=b.length&&(d.index.La()?f(a,e.get(b[0])):yf(e,b).forEach(f.bind(null,a)))},a);a=k.s().concat(n.s());return new G(B,a)};function Rg(a,b,c){return null===b?new je(a,b,c):p(b.j)?new Lg(a,b,c):new je(a,b,c)};var Sg={};q("lf.schema.DataStoreType",Sg);Sg.INDEXED_DB=0;Sg.MEMORY=1;Sg.LOCAL_STORAGE=2;Sg.FIREBASE=3;Sg.WEB_SQL=4;Sg.OBSERVABLE_STORE=5;function Tg(a,b,c,d){this.pc=a;this.name=b;this.Gc=c;this.f=d}Tg.prototype.j=function(){return this.pc+"."+this.name};function xg(a){return a.f.some(function(a){return a.ba.kc()})}function Q(a,b,c,d){this.A=a;this.ta=c;this.K=b;this.ud=d;this.jb=null}q("lf.schema.Table",Q);Q.prototype.getName=g("A");Q.prototype.getName=Q.prototype.getName;Q.prototype.$a=g("jb");
	function Nd(a){return a.jb||a.A}Q.prototype.uc=function(a){var b=new this.constructor(this.A);b.jb=a;b.Kg=this.Kg;return b};Q.prototype.as=Q.prototype.uc;Q.prototype.createRow=Q.prototype.Ab;Q.prototype.deserializeRow=Q.prototype.mb;Q.prototype.Da=g("ta");Q.prototype.getIndices=Q.prototype.Da;Q.prototype.nb=g("K");Q.prototype.getColumns=Q.prototype.nb;Q.prototype.getConstraint=Q.prototype.Jb;Q.prototype.Fb=g("ud");Q.prototype.persistentIndex=Q.prototype.Fb;function ff(a){return a.A+".#"};function R(a,b){this.child=a;this.Ob=b;this.jb=null}m=R.prototype;m.getName=function(){return this.Ob+"("+this.child.getName()+")"};m.j=function(){return this.Ob+"("+this.child.j()+")"};m.H=function(){return this.child.H()};m.toString=function(){return this.j()};m.I=function(){return this.child.I()};m.$a=g("jb");m.Da=function(){return[]};m.Ca=l(null);m.kc=l(!1);m.uc=function(a){this.jb=a;return this};R.prototype.as=R.prototype.uc;
	function Ug(a){for(var b=[a];a instanceof R;)b.push(a.child),a=a.child;return b}function Vg(a){this.jb=a||null;this.U=new Q("#UnknownTable",[],[],!1)}m=Vg.prototype;m.getName=l("*");m.j=function(){return this.getName()};m.toString=function(){return this.j()};m.H=g("U");m.I=l(4);m.$a=g("jb");m.Da=function(){return[]};m.Ca=l(null);m.kc=l(!1);q("lf.fn.avg",function(a){return new R(a,"AVG")});function Wg(a){return new R(a||new Vg,"COUNT")}q("lf.fn.count",Wg);function Xg(a){return new R(a,"DISTINCT")}q("lf.fn.distinct",Xg);q("lf.fn.max",function(a){return new R(a,"MAX")});q("lf.fn.min",function(a){return new R(a,"MIN")});q("lf.fn.stddev",function(a){return new R(a,"STDDEV")});q("lf.fn.sum",function(a){return new R(a,"SUM")});q("lf.fn.geomean",function(a){return new R(a,"GEOMEAN")});function S(a,b){I.call(this);this.Xf=b}r(S,I);S.prototype.exec=function(a,b){switch(this.Xf){case 1:return Yg(this,a,b);case 0:return Zg(this,a,b);default:return $g(this,a,b)}};S.prototype.toString=l("dummy_node");S.prototype.Sc=function(){return this.toString()};function $g(a,b,c){return new u(function(a){a(this.ca([],b,c))}.bind(a))}function Yg(a,b,c){return ce(a,0).exec(b,c).then(function(a){return this.ca(a,b,c)}.bind(a))}
	function Zg(a,b,c){var d=J(a).map(function(a){return a.exec(b,c)});return eb(d).then(function(a){var d=[];a.forEach(function(a){for(var b=0;b<a.length;++b)d.push(a[b])});return this.ca(d,b,c)}.bind(a))};function ah(a){S.call(this,0,1);this.De=a}r(ah,S);ah.prototype.toString=function(){return"aggregation("+this.De.map(function(a){return a.j()}).toString()+")"};ah.prototype.ca=function(a){a.forEach(function(a){bh(new ch(a,this.De))},this);return a};function ch(a,b){this.Ma=a;this.K=b}
	function bh(a){a.K.forEach(function(a){a=Ug(a).reverse();for(var c=1;c<a.length;c++){var d=a[c],e=Ug(d).slice(-1)[0],f=d.child instanceof R?Fd(this.Ma,d.child):this.Ma;if(null!==f.Za&&f.Za.has(d.j()))break;f=dh(d.Ob,f,e);e=this.Ma;null===e.Za&&(e.Za=x());e.Za.set(d.j(),f)}},a)}
	function dh(a,b,c){var d=null;switch(a){case "MIN":d=eh(b,c,function(a,b){return b<a?b:a});break;case "MAX":d=eh(b,c,function(a,b){return b>a?b:a});break;case "DISTINCT":d=fh(b,c);break;case "COUNT":d=gh(b,c);break;case "SUM":d=hh(b,c);break;case "AVG":a=gh(b,c);0<a&&(d=hh(b,c)/a);break;case "GEOMEAN":d=ih(b,c);break;default:d=jh(b,c)}return d}function eh(a,b,c){return a.entries.reduce(function(a,e){var f=H(e,b);return null===f?a:null===a?f:c(a,f)},null)}
	function gh(a,b){return b instanceof Vg?a.entries.length:a.entries.reduce(function(a,d){return a+(null===H(d,b)?0:1)},0)}function hh(a,b){return eh(a,b,function(a,b){return b+a})}function jh(a,b){var c=[];a.entries.forEach(function(a){a=H(a,b);null===a||c.push(a)});return 0==c.length?null:ub.apply(null,c)}function ih(a,b){var c=0,d=a.entries.reduce(function(a,d){var h=H(d,b);if(0==h||null===h)return a;c++;return a+Math.log(h)},0);return 0==c?null:Math.pow(Math.E,d/c)}
	function fh(a,b){var c=x();a.entries.forEach(function(a){var e=H(a,b);c.set(e,a)});return new G(y(c),a.s())};function kh(a,b){this.Ha=a;this.aa=b}kh.prototype.ab=g("Ha");kh.prototype.da=g("aa");function lh(){I.call(this)}r(lh,I);function mh(a,b){I.call(this);this.table=a;this.values=b}r(mh,lh);function nh(a,b){mh.call(this,a,b)}r(nh,mh);function oh(a){I.call(this);this.table=a}r(oh,lh);oh.prototype.toString=function(){return"delete("+this.table.getName()+")"};function ph(a){I.call(this);this.table=a}r(ph,lh);ph.prototype.toString=function(){return"update("+this.table.getName()+")"};
	function qh(a){I.call(this);this.O=a}r(qh,lh);qh.prototype.toString=function(){return"select("+this.O.toString()+")"};function rh(a){I.call(this);this.table=a}r(rh,lh);rh.prototype.toString=function(){var a="table_access("+this.table.getName();null===this.table.$a()||(a+=" as "+this.table.$a());return a+")"};function sh(){I.call(this)}r(sh,lh);sh.prototype.toString=l("cross_product");function th(a,b){I.call(this);this.f=a;this.Sb=b}r(th,lh);
	th.prototype.toString=function(){var a="project("+this.f.toString();if(null!==this.Sb)var b=this.Sb.map(function(a){return a.j()}).join(", "),a=a+(", groupBy("+b+")");return a+")"};function uh(a){I.call(this);this.N=a}r(uh,lh);uh.prototype.toString=function(){return"order_by("+ue(this.N)+")"};function vh(a){I.call(this);this.f=a}r(vh,lh);vh.prototype.toString=function(){return"aggregation("+this.f.toString()+")"};function wh(a){I.call(this);this.f=a}r(wh,lh);
	wh.prototype.toString=function(){return"group_by("+this.f.toString()+")"};function xh(a){I.call(this);this.X=a}r(xh,lh);xh.prototype.toString=function(){return"limit("+this.X+")"};function yh(a){I.call(this);this.L=a}r(yh,lh);yh.prototype.toString=function(){return"skip("+this.L+")"};function zh(a,b){I.call(this);this.O=a;this.Ub=b}r(zh,lh);zh.prototype.toString=function(){return"join(type: "+(this.Ub?"outer":"inner")+", "+this.O.toString()+")"};function Ah(){};function Bh(){}r(Bh,Ah);Bh.prototype.gb=function(a){this.G=a;this.xb(this.G);return this.G};Bh.prototype.xb=function(a){if(a instanceof qh){var b=Ch(this,a.O),b=Dh(this,b);Gg(a,a,b[0],b[1]);a==this.G&&(this.G=b[0]);a=b[0]}J(a).forEach(function(a){this.xb(a)},this)};function Ch(a,b){if(0==J(b).length||"and"!=b.rb)return[b];var c=J(b).slice().map(function(a){b.removeChild(a);return Ch(this,a)},a);return Ea(c)}
	function Dh(a,b){var c=null,d=null;b.map(function(a,b){var h=new qh(a);0==b?c=h:K(d,h);d=h},a);return[c,d]};function Eh(){}r(Eh,Ah);Eh.prototype.gb=function(a,b){if(3>b.from.length)return a;this.G=a;this.xb(this.G);return this.G};Eh.prototype.xb=function(a){if(a instanceof sh)for(;2<J(a).length;){for(var b=new sh,c=0;2>c;c++){var d=ee(a,0);K(b,d)}de(a,b,0)}J(a).forEach(function(a){this.xb(a)},this)};function Fh(){S.call(this,0,0)}r(Fh,S);Fh.prototype.toString=l("cross_product");Fh.prototype.ca=function(a){var b=a[0],c=a[1];a=[];for(var d=b.s(),e=c.s(),f=0;f<b.entries.length;f++)for(var h=0;h<c.entries.length;h++){var k=Pd(b.entries[f],d,c.entries[h],e);a.push(k)}b=b.s().concat(c.s());return[new G(a,b)]};function Gh(a,b){xe.call(this,a,b);this.Ia=a.b(tc);this.Lb=a.b(uc)}r(Gh,xe);Gh.prototype.getPriority=l(2);Gh.prototype.he=function(a){0==this.I()?Hh(this,a):this.Pc()};function Hh(a,b){a.vd.forEach(function(a,d){a instanceof te&&Ae(this.Lb,a,b[d])},a)}Gh.prototype.Pc=function(){var a=Ce(this.Lb,this.da());0!=a.length&&(a=new ze(this.global,a),De(this.Ia,a))};function Ih(a){ne.call(this,a)}r(Ih,ne);Ih.prototype.da=function(){var a=A();a.add(this.from);Jh(this,this.from.getName(),a);return a};function Jh(a,b,c){var d=Kh(a.ba.info(),b,1);Kh(a.ba.info(),b).forEach(c.add.bind(c));d.forEach(function(a){Jh(this,a.getName(),c)},a)}Ih.prototype.clone=function(){var a=new Ih(this.ba);re(a,this);a.from=this.from;return a};Ih.prototype.bind=function(a){Ih.hb.bind.call(this,a);se(this,a);return this};function Lh(a){ne.call(this,a)}r(Lh,ne);Lh.prototype.da=function(){var a=A();a.add(this.Ka);var b=this.ba.info();Mh(this.Ka.getName(),b.gf).forEach(a.add.bind(a));this.dc&&Kh(b,this.Ka.getName()).forEach(a.add.bind(a));return a};Lh.prototype.clone=function(){var a=new Lh(this.ba);re(a,this);a.Ka=this.Ka;this.values&&(a.values=this.values instanceof Qd?this.values:this.values.slice());a.dc=this.dc;a.ec=this.ec;return a};
	Lh.prototype.bind=function(a){Lh.hb.bind.call(this,a);this.ec&&(this.values=this.ec instanceof Qd?a[this.ec.Ca()]:this.ec.map(function(b){return b instanceof Qd?a[b.Ca()]:b}));return this};function Nh(a){ne.call(this,a)}r(Nh,ne);Nh.prototype.da=function(){var a=A();a.add(this.table);var b=this.set.map(function(a){return a.J.j()}),c=this.ba.info();Oh(c,b).forEach(a.add.bind(a));Ph(c,b).forEach(a.add.bind(a));return a};Nh.prototype.clone=function(){var a=new Nh(this.ba);re(a,this);a.table=this.table;a.set=this.set?Qh(this.set):this.set;return a};Nh.prototype.bind=function(a){Nh.hb.bind.call(this,a);this.set.forEach(function(b){-1!=b.Wc&&(b.value=a[b.Wc])});se(this,a);return this};
	function Qh(a){return a.map(function(a){var c={},d;for(d in a)c[d]=a[d];return c})};function Rh(a,b){if(null==b)return"NULL";switch(a){case 1:return b?1:0;case 3:case 4:return b;case 0:return"'"+fc(b)+"'";default:return"'"+b.toString()+"'"}}function Sh(a,b){var c=a.dc?"INSERT OR REPLACE":"INSERT",d=a.Ka.nb(),c=c+(" INTO "+a.Ka.getName()+"("),c=c+d.map(function(a){return a.getName()}).join(", "),c=c+") VALUES (";return a.values.map(function(a){var f=d.map(function(c){var d=a.m[c.getName()];return b?null!=d?"#":"NULL":Rh(c.I(),d)});return c+f.join(", ")+");"}).join("\n")}
	function Th(a){switch(a){case "between":return"BETWEEN";case "eq":return"=";case "gte":return">=";case "gt":return">";case "in":return"IN";case "lte":return"<=";case "lt":return"<";case "match":return"LIKE";case "neq":return"<>";default:return"UNKNOWN"}}function Uh(a,b,c,d){return a instanceof Qd?"?"+a.Ca().toString():d?null!=a?"#":"NULL":"match"==b?"'"+a.toString()+"'":"in"==b?"("+a.map(function(a){return Rh(c,a)}).join(", ")+")":"between"==b?Rh(c,a[0])+" AND "+Rh(c,a[1]):Rh(c,a).toString()}
	function Vh(a,b){return J(a).map(function(a){return"("+Wh(a,b)+")"}).join("and"==a.rb?" AND ":" OR ")}function Xh(a){return[a.ga.j(),Th(a.C),a.na.j()].join(" ")}function Wh(a,b){if(a instanceof je){var c=a.J.j(),d=Th(a.C),e=Uh(a.value,a.C,a.J.I(),b);return"="==d&&"NULL"==e?[c,"IS NULL"].join(" "):"<>"==d&&"NULL"==e?[c,"IS NOT NULL"].join(" "):[c,d,e].join(" ")}if(a instanceof Ig)return Vh(a,b);if(a instanceof Lg)return Xh(a);throw new D(357,typeof a);}
	function Yh(a,b){var c=Wh(a,b);return c?" WHERE "+c:""}function Zh(a,b){var c="UPDATE "+a.table.getName()+" SET ",c=c+a.set.map(function(a){var b=a.J.j()+" = ";return-1!=a.Wc?b+"?"+a.Wc.toString():b+Rh(a.J.I(),a.value).toString()}).join(", ");a.w&&(c+=Yh(a.w,b));return c+";"}
	function $h(a,b){var c="*";a.f.length&&(c=a.f.map(function(a){return a.$a()?a.j()+" AS "+a.$a():a.j()}).join(", "));c="SELECT "+c+" FROM ";null!=a.cb&&0!=a.cb.size?c+=ai(a,b):(c+=a.from.map(bi).join(", "),a.w&&(c+=Yh(a.w,b)));if(a.N)var d=a.N.map(function(a){return a.J.j()+(0==a.sb?" DESC":" ASC")}).join(", "),c=c+(" ORDER BY "+d);a.la&&(d=a.la.map(function(a){return a.j()}).join(", "),c+=" GROUP BY "+d);a.X&&(c+=" LIMIT "+a.X.toString());a.L&&(c+=" SKIP "+a.L.toString());return c+";"}
	function bi(a){return Nd(a)!=a.getName()?a.getName()+" AS "+Nd(a):a.getName()}function ai(a,b){for(var c=Bg(a.w,function(a){return a instanceof Lg}),d=c.map(Xh),e=bi(a.from[0]),f=1;f<a.from.length;f++)var h=bi(a.from[f]),e=a.cb.has(c[d.length-f].W())?e+(" LEFT OUTER JOIN "+h):e+(" INNER JOIN "+h),e=e+(" ON ("+d[d.length-f]+")");c=ce(a.w,0);c instanceof Lg||(e+=" WHERE "+Wh(c,b));return e}
	function ci(a,b){var c=b||!1,d=a.query.clone();if(d instanceof Lh)return Sh(d,c);if(d instanceof Ih){var e="DELETE FROM "+d.from.getName();d.w&&(e+=Yh(d.w,c));return e+";"}if(d instanceof Nh)return Zh(d,c);if(d instanceof te)return $h(d,c);throw new D(358,typeof d);};function T(a,b){this.global=a;this.Jg=a.b(sc);this.Ia=a.b(tc);this.query=b}q("lf.query.BaseBuilder",T);T.prototype.exec=function(){try{this.kb()}catch(a){return bb(a)}return new u(function(a,b){var c=new Gh(this.global,[this.Ec()]);De(this.Ia,c).then(function(b){a(Dd(b[0]))},b)},this)};T.prototype.exec=T.prototype.exec;T.prototype.Zf=function(){var a=function(a){return a.Sc(this.query)+"\n"}.bind(this);return Hg(di(this).ab(),a)};T.prototype.explain=T.prototype.Zf;
	T.prototype.bind=function(a){this.query.bind(a);return this};T.prototype.bind=T.prototype.bind;T.prototype.Rg=function(a){return ci(this,a)};T.prototype.toSql=T.prototype.Rg;T.prototype.kb=aa();function di(a){if(null==a.hf){var b;b=a.Jg;var c=a.query,d=b.sg.create(c);b=b.Gg.create(d,c);a.hf=b}return a.hf}T.prototype.Ec=function(){return{context:this.query.clone(),ke:di(this)}};function ei(a){T.call(this,a,new Ih(a.b(vc)))}r(ei,T);q("lf.query.DeleteBuilder",ei);ei.prototype.from=function(a){if(null!=this.query.from)throw new D(515);this.query.from=a;return this};ei.prototype.from=ei.prototype.from;ei.prototype.w=function(a){this.Hd();this.query.w=a;return this};ei.prototype.where=ei.prototype.w;ei.prototype.Hd=function(){if(null==this.query.from)throw new D(548);if(null!=this.query.w)throw new D(516);};
	ei.prototype.kb=function(){ei.hb.kb.call(this);if(null==this.query.from)throw new D(517);};function fi(a,b){T.call(this,a,new Lh(a.b(vc)));this.query.dc=b||!1}r(fi,T);q("lf.query.InsertBuilder",fi);fi.prototype.kb=function(){fi.hb.kb.call(this);var a=this.query;if(null==a.Ka||null==a.values)throw new D(518);if(a.dc&&null===a.Ka.Jb().ed())throw new D(519);};fi.prototype.Ka=function(a){if(null!=this.query.Ka)throw new D(520);this.query.Ka=a;return this};fi.prototype.into=fi.prototype.Ka;
	fi.prototype.values=function(a){if(null!=this.query.values)throw new D(521);a instanceof Qd||a.some(function(a){return a instanceof Qd})?this.query.ec=a:this.query.values=a;return this};fi.prototype.values=fi.prototype.values;function gi(a){return hi("and",Array.prototype.slice.call(arguments))}q("lf.op.and",gi);q("lf.op.or",function(a){return hi("or",Array.prototype.slice.call(arguments))});function hi(a,b){var c=new Ig(a);b.forEach(function(a){K(c,a)});return c}q("lf.op.not",function(a){a.xd(!0);return a});function U(a,b){T.call(this,a,new te(a.b(vc)));this.Ne=this.Cd=!1;this.query.f=b;ii(this);ji(this)}r(U,T);q("lf.query.SelectBuilder",U);U.prototype.kb=function(){U.hb.kb.call(this);var a=this.query;if(null==a.from)throw new D(522);if(p(a.Vb)&&!p(a.X)||p(a.bc)&&!p(a.L))throw new D(523);null!=this.query.la?ki(this):li(this)};function ii(a){var b=a.query.f.filter(function(a){return a instanceof R&&"DISTINCT"==a.Ob},a);if(0!=b.length&&(1!=b.length||1!=a.query.f.length))throw new D(524);}
	function ki(a){var b=a.query.f.filter(function(a){return!(a instanceof R)}).map(function(a){return a.j()}),c=!1;if(0==a.query.la.length||0==a.query.f.length)c=!0;else{var d=a.query.la.map(function(a){return a.j()});(c=b.some(function(a){return-1==d.indexOf(a)}))||(c=a.query.la.some(function(a){a=a.I();return 6==a||0==a}))}if(c)throw new D(525);}
	function li(a){var b=a.query.f.some(function(a){return a instanceof R},a);a=a.query.f.some(function(a){return!(a instanceof R)},a)||0==a.query.f.length;if(b&&a)throw new D(526);}function ji(a){a.query.f.forEach(function(a){if(a instanceof R&&!mi(a.Ob,a.I()))throw new D(527,a.j());},a)}function ni(a,b){if(null==a.query.from)throw new D(b);}
	U.prototype.from=function(a){if(this.Ne)throw new D(515);this.Ne=!0;null==this.query.from&&(this.query.from=[]);this.query.from.push.apply(this.query.from,Array.prototype.slice.call(arguments));return this};U.prototype.from=U.prototype.from;U.prototype.w=function(a){ni(this,548);if(this.Cd)throw new D(516);this.Cd=!0;oi(this,a);return this};U.prototype.where=U.prototype.w;function oi(a,b){if(null!=a.query.w){var c=gi(b,a.query.w);a.query.w=c}else a.query.w=b}
	U.prototype.jg=function(a,b){ni(this,542);if(this.Cd)throw new D(547);this.query.from.push(a);oi(this,b);return this};U.prototype.innerJoin=U.prototype.jg;U.prototype.qg=function(a,b){ni(this,542);if(!(b instanceof Lg))throw new D(541);if(this.Cd)throw new D(547);this.query.from.push(a);null==this.query.cb&&(this.query.cb=A());var c=b;Nd(a)!=Nd(b.na.H())&&(c=b.reverse());this.query.cb.add(c.W());oi(this,c);return this};U.prototype.leftOuterJoin=U.prototype.qg;
	U.prototype.X=function(a){if(null!=(this.query.X||this.query.Vb))throw new D(528);if(a instanceof Qd)this.query.Vb=a;else{if(0>a)throw new D(531);this.query.X=a}return this};U.prototype.limit=U.prototype.X;U.prototype.L=function(a){if(null!=(this.query.L||this.query.bc))throw new D(529);if(a instanceof Qd)this.query.bc=a;else{if(0>a)throw new D(531);this.query.L=a}return this};U.prototype.skip=U.prototype.L;
	U.prototype.N=function(a,b){ni(this,549);null==this.query.N&&(this.query.N=[]);this.query.N.push({J:a,sb:null!=b?b:1});return this};U.prototype.orderBy=U.prototype.N;U.prototype.la=function(a){ni(this,549);if(null!=this.query.la)throw new D(530);null==this.query.la&&(this.query.la=[]);this.query.la.push.apply(this.query.la,Array.prototype.slice.call(arguments));return this};U.prototype.groupBy=U.prototype.la;
	function mi(a,b){switch(a){case "COUNT":case "DISTINCT":return!0;case "AVG":case "GEOMEAN":case "STDDEV":case "SUM":return 4==b||3==b;case "MAX":case "MIN":return 4==b||3==b||5==b||2==b}return!1}U.prototype.clone=function(){var a=new U(this.global,this.query.f);a.query=this.query.clone();a.query.Zc=null;return a};U.prototype.clone=U.prototype.clone;function pi(a,b){T.call(this,a,new Nh(a.b(vc)));this.query.table=b}r(pi,T);q("lf.query.UpdateBuilder",pi);pi.prototype.set=function(a,b){var c={Wc:b instanceof Qd?b.Ca():-1,J:a,value:b};null!=this.query.set?this.query.set.push(c):this.query.set=[c];return this};pi.prototype.set=pi.prototype.set;pi.prototype.w=function(a){this.Hd();this.query.w=a;return this};pi.prototype.where=pi.prototype.w;pi.prototype.Hd=function(){if(null!=this.query.w)throw new D(516);};
	pi.prototype.kb=function(){pi.hb.kb.call(this);if(null==this.query.set)throw new D(532);if(this.query.set.some(function(a){return a.value instanceof Qd}))throw new D(501);};function qi(a){this.query=a;this.Ha=null}qi.prototype.jc=function(){null===this.Ha&&(this.Ha=this.cd());return this.Ha};function ri(a){qi.call(this,a)}r(ri,qi);ri.prototype.cd=function(){return this.query.dc?new nh(this.query.Ka,this.query.values):new mh(this.query.Ka,this.query.values)};function si(a){qi.call(this,a)}r(si,qi);si.prototype.cd=function(){var a=new ph(this.query.table),b=null!=this.query.w?new qh(this.query.w.Pb()):null,c=new rh(this.query.table);null===b?K(a,c):(K(b,c),K(a,b));return a};function ti(a,b,c){this.Ha=a;this.le=b;this.Yb=c}ti.prototype.jc=function(){this.Yb.forEach(function(a){this.Ha=a.gb(this.Ha,this.le)},this);return this.Ha};function ui(a,b){qi.call(this,a);this.Yb=b}r(ui,qi);ui.prototype.cd=function(){var a=new oh(this.query.from),b=null!=this.query.w?new qh(this.query.w.Pb()):null,c=new rh(this.query.from);null===b?K(a,c):(K(b,c),K(a,b));return(new ti(a,this.query,this.Yb)).jc()};function vi(){}r(vi,Ah);vi.prototype.gb=function(a,b){if(2>b.from.length)return a;this.G=a;this.xb(this.G,b);return this.G};vi.prototype.xb=function(a,b){if(a instanceof qh&&a.O instanceof Lg){var c=a.O.W(),d=ce(a,0);d instanceof sh&&(c=null!=b.cb&&b.cb.has(c),c=new zh(a.O,c),Gg(a,d,c,c),a==this.G&&(this.G=c),a=c)}J(a).forEach(function(a){this.xb(a,b)},this)};function wi(){this.Vc=A()}r(wi,Ah);wi.prototype.gb=function(a,b){if(!p(b.w))return a;this.Vc.clear();this.G=a;this.xb(this.G,b);this.Vc.clear();return this.G};wi.prototype.xb=function(a,b){var c=function(a){J(a).forEach(d)}.bind(this),d=function(a){if(!this.Vc.has(a)){if(a instanceof qh){var f=a.O.s(),h=function(a){return xi(this,a,f)}.bind(this),h=yi(this,b,a,h);this.Vc.add(a);h!=a&&(null===h.getParent()&&(this.G=h),d(h))}c(a)}}.bind(this);d(a)};
	function yi(a,b,c,d){var e=c;if(zi(b,c))e=Eg(c),yi(a,b,c,d);else if(Ai(c)){var f=[],e=Fg(c,d,function(a){a=new qh(a.O);f.push(a);return a});f.forEach(function(a){yi(this,b,a,d)},a)}return e}function xi(a,b,c){var d=A();Ag(b).forEach(function(a){d.add(a.table)},a);b instanceof rh&&d.add(b.table);return Bc(d,c)}function Ai(a){a=ce(a,0);return a instanceof sh||a instanceof zh}
	function zi(a,b){var c=ce(b,0);if(!(c instanceof qh))return!1;if(null==a.cb)return!0;var d=b.O instanceof Lg,c=a.cb.has(c.O.W());return d||!c};function Bi(a,b){qi.call(this,a);this.Yb=b;this.mf=this.cf=this.vf=this.ff=this.Ee=this.Se=this.uf=this.Ke=this.xf=null}r(Bi,qi);
	Bi.prototype.cd=function(){Ci(this);2<=this.query.from.length&&(this.Ke=new sh);this.uf=null!=this.query.w?new qh(this.query.w.Pb()):null;this.query.N&&(this.ff=new uh(this.query.N));null!=this.query.L&&0<this.query.L&&(this.vf=new yh(this.query.L));null!=this.query.X&&(this.cf=new xh(this.query.X));null!=this.query.la&&(this.Se=new wh(this.query.la));Di(this);this.mf=new th(this.query.f||[],this.query.la||null);var a=Ei(this);return(new ti(a,this.query,this.Yb)).jc()};
	function Ei(a){for(var b=[a.cf,a.vf,a.mf,a.ff,a.Ee,a.Se,a.uf,a.Ke],c=-1,d=null,e=0;e<b.length;e++){var f=b[e];null!==f&&(null===d?d=f:K(b[c],f),c=e)}a.xf.forEach(function(a){K(b[c],a)});return d}function Ci(a){a.xf=a.query.from.map(function(a){return new rh(a)},a)}function Di(a){var b=a.query.f.filter(function(a){return a instanceof R});null!=a.query.N&&a.query.N.forEach(function(a){a.J instanceof R&&b.push(a.J)});0<b.length&&(a.Ee=new vh(b))};function Fi(){this.se=[new Bh,new Eh,new wi,new vi];this.Rd=[new Bh]}Fi.prototype.create=function(a){var b=null;if(a instanceof Lh)b=new ri(a);else if(a instanceof Ih)b=new ui(a,this.Rd);else if(a instanceof te)b=new Bi(a,this.se);else if(a instanceof Nh)b=new si(a);else throw new D(513);b=b.jc();return new kh(b,a.da())};function Gi(a){S.call(this,0,1);this.U=a}r(Gi,S);Gi.prototype.toString=function(){return"delete("+this.U.getName()+")"};Gi.prototype.ca=function(a,b){var c=a[0].entries.map(function(a){return a.va});b.remove(this.U,c);return[Hd()]};function Hi(a,b){S.call(this,0,-1);this.table=b;this.D=a.b(rc)}r(Hi,S);Hi.prototype.toString=function(){return"get_row_count("+this.table.getName()+")"};Hi.prototype.ca=function(){var a=this.D.get(ff(this.table)),b=new G([],[this.table.getName()]),c=Wg(),a=a.Y().ia;null===b.Za&&(b.Za=x());b.Za.set(c.j(),a);return[b]};function Ii(a,b){S.call(this,0,-1);this.V=a.b(qc);this.D=a.b(rc);this.table=b}r(Ii,S);Ii.prototype.toString=function(){var a="table_access("+this.table.getName();null===this.table.$a()||(a+=" as "+this.table.$a());return a+")"};Ii.prototype.ca=function(){var a=this.D.get(ff(this.table)).Ua();return[Kd(yf(this.V,a),[Nd(this.table)])]};function Ji(a){this.c=a}r(Ji,Ah);Ji.prototype.gb=function(a,b){this.G=a;if(!this.Jd(b))return a;var c=Bg(a,function(a){return a instanceof Ii})[0],d=new Hi(this.c,c.table);Gg(c,c,d,d);return this.G};Ji.prototype.Jd=function(a){return 1==a.f.length&&1==a.from.length&&null==a.w&&null==a.X&&null==a.L&&null==a.la?(a=a.f[0],a instanceof R&&"COUNT"==a.Ob&&a.child instanceof Vg):!1};function Ki(a){S.call(this,0,1);this.Re=a}r(Ki,S);Ki.prototype.toString=function(){return"groupBy("+this.Re.map(function(a){return a.j()}).toString()+")"};Ki.prototype.ca=function(a){return Li(this,a[0])};function Li(a,b){var c=new Xc,d=function(a){return this.Re.map(function(b){return H(a,b)},this).join(",")}.bind(a);b.entries.forEach(function(a){c.set(d(a),a)},a);return c.keys().map(function(a){return new G(c.get(a),b.s())},a)};function Mi(a,b,c){S.call(this,0,0);this.D=a.b(rc);this.V=a.b(qc);this.O=b;this.Ub=c;this.Fd="eq"==this.O.C?0:2;this.Ue=null}r(Mi,S);var Ni=["hash","index_nested_loop","nested_loop"];Mi.prototype.toString=function(){return"join(type: "+(this.Ub?"outer":"inner")+", impl: "+Ni[this.Fd]+", "+this.O.toString()+")"};
	Mi.prototype.ca=function(a){switch(this.Fd){case 0:return[Pg(this.O,a[0],a[1],this.Ub)];case 1:return[Qg(this.O,a[0],a[1],this.Ue,this.V)];default:var b=this.O,c=a[0];a=a[1];var d=this.Ub,e=[c,a];d||(e=Mg(b,c,a));c=e[0];a=e[1];for(var e=[],f=c.s(),h=a.s(),k=c.entries.length,n=a.entries.length,B=n+256-1>>8,O=0;O<B;){for(var ea=0;ea<k;ea++){var Cb=!1,fg=H(c.entries[ea],b.ga);if(null!==fg)for(var ec=Math.min(O+1<<8,n),Db=O<<8;Db<ec;Db++)if(b.yc(fg,H(a.entries[Db],b.na))){var Cb=!0,Uc=Pd(c.entries[ea],
	f,a.entries[Db],h);e.push(Uc)}d&&!Cb&&e.push(Og(b,c.entries[ea],f))}O++}b=c.s().concat(a.s());return[new G(e,b)]}};function Oi(a,b){a.Fd=1;var c=a.D.get(b.Ca().j());a.Ue={fg:b,yg:b==a.O.ga?a.O.na:a.O.ga,index:c}};function Pi(a){S.call(this,0,-1);this.nf=a}r(Pi,S);Pi.prototype.toString=function(){return"no_op_step("+this.nf[0].s().join(",")+")"};Pi.prototype.ca=g("nf");function Qi(){}r(Qi,Ah);Qi.prototype.gb=function(a,b){this.G=a;if(!this.Jd(b))return a;Bg(a,function(a){return a instanceof Mi}).forEach(this.Ig,this);return this.G};Qi.prototype.Jd=function(a){return 1<a.from.length};
	Qi.prototype.Ig=function(a){if("eq"==a.O.C&&!a.Ub){var b=function(b){if(!(b instanceof Ii))return null;b=Nd(b.table)==Nd(a.O.na.H())?a.O.na:a.O.ga;return null===b.Ca()?null:b},c=b(ce(a,0)),b=b(ce(a,1));if(null!==c||null!==b){b=null===b?c:b;Oi(a,b);var d=new G([],[Nd(b.H())]);fe(a,new Pi([d]),b==c?0:1)}}};function Ri(a){a=a.map(function(a){return a.ra()});a=zb.apply(null,a);var b=[];yb(a,function(a){b.push(a)});return b}function Si(a){this.Tb=a}Si.prototype.dd=function(){return 1==this.Tb.f.length?[xd()]:[this.Tb.f.map(function(){return xd()})]};function Ti(a,b){this.Tb=a;this.Ga=b;this.Nd=this.af=null}
	function Ui(a,b){var c=x();a.Ga.keys().forEach(function(a){var e=this.Ga.get(a).map(function(a){return oe(b,a)},this),f=new Bd([xd()]);e.forEach(function(a){f=Cd(f,a.xe())});c.set(a,f)},a);return c}Ti.prototype.dd=function(a){if(this.af==a)return this.Nd;for(var b=Ui(this,a),c=this.Tb.f.length-1;0<=c;c--){var d=this.Tb.f[c];if(null!==(b.get(d.ba.getName())||null))break;b.set(d.ba.getName(),new Bd([xd()]))}this.Nd=1==this.Tb.f.length?y(b)[0].ra():Ri(Vi(this,b));this.af=a;return this.Nd};
	function Vi(a,b){var c=x(),d=0;a.Tb.f.forEach(function(a){c.set(a.ba.getName(),d);d++});return $b(b).sort(function(a,b){return c.get(a)-c.get(b)}).map(function(a){return b.get(a)})};function Wi(a,b){this.zd=b;this.D=a.b(rc)}function Xi(a){a=a.D.get(ff(a.zd));return Math.floor(.02*a.Y().ia)}function Yi(a,b,c){c=c.filter(a.mg,a);if(0==c.length)return null;a=Zi(a,c);if(0==a.length)return null;if(1==a.length)return a[0];var d=Number.MAX_VALUE;return a.reduce(function(a,c){var h=$i(c,b);return h<d?(d=h,c):a},null)}
	function Zi(a,b){return a.zd.Da().map(function(a){a=new aj(this.D,a);bj(a,b);return a},a).filter(function(a){if(null===a.Ga)a=!1;else{for(var b=!1,e=!0,f=0;f<a.bb.f.length;f++){var h=a.Ga.has(a.bb.f[f].ba.getName());if(b&&h){e=!1;break}h||(b=!0)}a=e}return a})}Wi.prototype.mg=function(a){return a instanceof je?!a.od()||a.J.H()!=this.zd||"in"==a.C&&a.value.length>Xi(this)?!1:!0:a instanceof Ig?a.od()&&ce(a,0).J.H()==this.zd?J(a).length<=Xi(this):!1:!1};
	function aj(a,b){this.D=a;this.bb=b;this.gg=A(this.bb.f.map(function(a){return a.ba.getName()}));this.be=this.Ga=null}function cj(a){null===a.be&&(a.be=new Ti(a.bb,a.Ga));return a.be}function bj(a,b){b.forEach(function(a){var b=a.nb()[0].getName();this.gg.has(b)&&(null===this.Ga&&(this.Ga=new Xc),this.Ga.set(b,a.W()))},a)}function $i(a,b){var c=cj(a).dd(b),d=a.D.get(a.bb.j());return c.reduce(function(a,b){return a+d.ad(b)},0)};function dj(a,b,c,d){S.call(this,0,-1);this.D=a.b(rc);this.index=b;this.$e=c;this.pe=d;this.Uc=this.Tc=!1}r(dj,S);dj.prototype.toString=function(){return"index_range_scan("+this.index.j()+", ?, "+(this.pe?"reverse":"natural")+(this.Tc?", limit:?":"")+(this.Uc?", skip:?":"")+")"};dj.prototype.Sc=function(a){var b=this.toString(),c=this.$e.dd(a),b=b.replace("?",c.toString());this.Tc&&(b=b.replace("?",a.X.toString()));this.Uc&&(b=b.replace("?",a.L.toString()));return b};
	dj.prototype.ca=function(a,b,c){a=this.$e.dd(c);b=this.D.get(this.index.j());c=(1==a.length&&a[0]instanceof E&&yd(a[0])?Cf(b.get(a[0].from),!1,this.Tc?c.X:void 0,this.Uc?c.L:void 0):b.Ua(a,this.pe,this.Tc?c.X:void 0,this.Uc?c.L:void 0)).map(function(a){return new ac(a,{})},this);return[Kd(c,[this.index.pc])]};function ej(){S.call(this,0,0)}r(ej,S);ej.prototype.toString=l("multi_index_range_scan()");
	ej.prototype.ca=function(a){var b=x();a.forEach(function(a){a.entries.forEach(function(a){b.set(a.va.id(),a)})});var c=y(b);return[new G(c,a[0].s())]};function fj(a){S.call(this,0,1);this.mc=a}r(fj,S);fj.prototype.toString=l("select(?)");fj.prototype.Sc=function(a){a=oe(a,this.mc);return this.toString().replace("?",a.toString())};fj.prototype.ca=function(a,b,c){return[oe(c,this.mc).eval(a[0])]};function gj(a,b){S.call(this,0,1);this.V=a.b(qc);this.U=b}r(gj,S);gj.prototype.toString=function(){return"table_access_by_row_id("+this.U.getName()+")"};gj.prototype.ca=function(a){return[Kd(yf(this.V,Ed(a[0])),[Nd(this.U)])]};function hj(a){this.c=a}r(hj,Ah);hj.prototype.gb=function(a,b){this.G=a;Bg(a,function(a){return a instanceof Ii}).forEach(function(a){var d=ij(a);if(0!=d.length){var e=Yi(new Wi(this.c,a.table),b,d.map(function(a){return oe(b,a.mc)}));if(null!==e){var f=x();d.forEach(function(a){f.set(a.mc,a)},this);this.G=jj(this,e,f,a)}}},this);return this.G};function ij(a){var b=[];for(a=a.getParent();a;){if(a instanceof fj)b.push(a);else if(a instanceof Mi)break;a=a.getParent()}return b}
	function jj(a,b,c,d){(null===b.Ga?[]:b.Ga.values()).map(function(a){return c.get(a)}).forEach(Cg);b=new dj(a.c,b.bb,cj(b),!1);a=new gj(a.c,d.table);K(a,b);Gg(d,d,a,b);return b.ab()};function kj(a,b){S.call(this,0,-1);this.D=a.b(rc);this.U=b}r(kj,S);kj.prototype.toString=function(){return"insert("+this.U.getName()+")"};kj.prototype.ca=function(a,b,c){lj(this.U,c.values,this.D);b.Db(this.U,c.values);return[Kd(c.values,[this.U.getName()])]};function lj(a,b,c){a=a.Jb().ed();if(null===a?0:a.f[0].autoIncrement){var d=a.f[0].ba.getName();c=c.get(a.j()).Y().Ic;var e=null===c?0:c;b.forEach(function(a){if(0==a.m[d]||null==a.m[d])e++,a.m[d]=e})}}
	function mj(a,b){S.call(this,0,-1);this.D=a.b(rc);this.U=b}r(mj,S);mj.prototype.toString=function(){return"insert_replace("+this.U.getName()+")"};mj.prototype.ca=function(a,b,c){lj(this.U,c.values,this.D);b.Yd(this.U,c.values);return[Kd(c.values,[this.U.getName()])]};function nj(){S.call(this,0,1)}r(nj,S);nj.prototype.toString=l("limit(?)");nj.prototype.Sc=function(a){return this.toString().replace("?",a.X.toString())};nj.prototype.ca=function(a,b,c){a[0].entries.splice(c.X);return a};function oj(a){S.call(this,0,1);this.N=a}r(oj,S);m=oj.prototype;m.toString=function(){return"order_by("+ue(this.N)+")"};m.ca=function(a){if(1==a.length){var b;b=a[0];for(var c=null,d=0;d<this.N.length;d++){var e=Xg(this.N[d].J);if(null!==b.Za&&b.Za.has(e.j())){c=e;break}}b=c;(null===b?a[0]:Fd(a[0],b)).entries.sort(this.Wf.bind(this))}else a.sort(this.Lg.bind(this));return a};
	m.$=function(a,b){var c=null,d=null,e=null,f=-1;do f++,e=this.N[f].J,c=this.N[f].sb,d=a(e),e=b(e);while(d==e&&f+1<this.N.length);d=d<e?-1:d>e?1:0;return 1==c?d:-d};m.Lg=function(a,b){return this.$(function(b){return b instanceof R?Fd(a,b):H(a.entries[a.entries.length-1],b)},function(a){return a instanceof R?Fd(b,a):H(b.entries[b.entries.length-1],a)})};m.Wf=function(a,b){return this.$(function(b){return H(a,b)},function(a){return H(b,a)})};function pj(a,b){this.Ma=a;this.K=b}function qj(a){return a.K.some(function(a){return a instanceof R},a)?rj(a):sj(a)}function rj(a){if(1==a.K.length&&"DISTINCT"==a.K[0].Ob)return a=Fd(a.Ma,a.K[0]).entries.map(function(a){var b=new Ld(new ac(-1,{}),1<this.Ma.M.size);Od(b,this.K[0],H(a,this.K[0].child));return b},a),new G(a,[]);var b=new Ld(new ac(-1,{}),1<a.Ma.M.size);a.K.forEach(function(a){var d=a instanceof R?Fd(this.Ma,a):H(this.Ma.entries[0],a);Od(b,a,d)},a);return new G([b],a.Ma.s())}
	function sj(a){var b=Array(a.Ma.entries.length),c=1<a.Ma.M.size;a.Ma.entries.forEach(function(a,e){b[e]=new Ld(new ac(a.va.id(),{}),c);this.K.forEach(function(c){Od(b[e],c,H(a,c))},this)},a);return new G(b,a.Ma.s())}function tj(a,b){var c=a.map(function(a){return qj(new pj(a,b)).entries[0]});return new G(c,a[0].s())};function uj(a,b){S.call(this,0,1);this.f=a;this.Sb=b}r(uj,S);uj.prototype.toString=function(){var a="project("+this.f.toString();if(null!==this.Sb)var b=this.Sb.map(function(a){return a.j()}).join(", "),a=a+(", groupBy("+b+")");return a+")"};uj.prototype.ca=function(a){0==a.length?a=[Hd()]:1==a.length?(a=a[0],a=[0==this.f.length?a:qj(new pj(a,this.f))]):a=[tj(a,this.f)];return a};function vj(a){return a.f.some(function(a){return a instanceof R})||null!==a.Sb};function wj(){S.call(this,0,1)}r(wj,S);wj.prototype.toString=l("skip(?)");wj.prototype.Sc=function(a){return this.toString().replace("?",a.L.toString())};wj.prototype.ca=function(a,b,c){return[new G(a[0].entries.slice(c.L),a[0].s())]};function xj(){}r(xj,Ah);xj.prototype.gb=function(a,b){if(!p(b.X)&&!p(b.L))return a;var c=yj(a);if(null===c)return a;Bg(a,function(a){return a instanceof nj||a instanceof wj}).forEach(function(a){a instanceof nj?c.Tc=!0:c.Uc=!0;Cg(a)},this);return c.ab()};function yj(a){a=Bg(a,function(a){return a instanceof dj},function(a){return a instanceof uj&&vj(a)||a instanceof oj||1!=J(a).length||a instanceof fj});return 0<a.length?a[0]:null};function zj(a){this.c=a}r(zj,Ah);zj.prototype.gb=function(a,b){this.G=a;var c=Aj(this,b);if(0==c.length)return this.G;var d=null,e=null,f=0;do e=c[f++],d=Bj(this,e,b);while(null===d&&f<c.length);if(null===d)return this.G;c=Cj(this,d[0].bb.pc);return null===c?this.G:this.G=Dj(this,e,c,d)};function Aj(a,b){return Bg(a.G,function(a){if(!(a instanceof fj))return!1;a=oe(b,a.mc);return a instanceof Ig&&"or"==a.rb})}
	function Cj(a,b){return Bg(a.G,function(a){return a instanceof Ii&&a.table.getName()==b})[0]||null}function Bj(a,b,c){b=oe(c,b.mc);var d=b.s();if(1!=d.size)return null;var d=C(d)[0],e=new Wi(a.c,d),f=null;return J(b).every(function(a){a=Yi(e,c,[a]);null===a||(null===f?f=[a]:f.push(a));return null!==a})?f:null}function Dj(a,b,c,d){var e=new gj(a.c,c.table),f=new ej;K(e,f);d.forEach(function(a){a=new dj(this.c,a.bb,cj(a),!1);K(f,a)},a);Cg(b);Gg(c,c,e,f);return f.ab()};function Ej(a){this.c=a}r(Ej,Ah);Ej.prototype.gb=function(a,b){var c=Fj(a,b);if(null===c)return a;var d;a:{var e=c;d=Gj(ce(c,0));if(null!==d){var f;f=c.N;for(var h=null,k=d.table.Da(),n=0;n<k.length&&null===h;n++)h=Hj(k[n],f);f=h;if(null===f){d=e;break a}e=new dj(this.c,f.bb,new Si(f.bb),f.Xe);f=new gj(this.c,d.table);K(f,e);Cg(c);e=Gg(d,d,f,e)}d=e}if(d==c)a:if(d=c,e=Ij(ce(c,0)),null!==e){f=Hj(e.index,c.N);if(null===f)break a;e.pe=f.Xe;d=Cg(c).parent}return d.ab()};
	function Ij(a){a=Bg(a,function(a){return a instanceof dj},function(a){return 1!=J(a).length});return 0<a.length?a[0]:null}function Gj(a){a=Bg(a,function(a){return a instanceof Ii},function(a){return 1!=J(a).length});return 0<a.length?a[0]:null}function Fj(a,b){return p(b.N)?Bg(a,function(a){return a instanceof oj})[0]:null}function Hj(a,b){if(a.f.length!=b.length||!b.every(function(b,c){return b.J.getName()==a.f[c].ba.getName()}))return null;var c=Jj(b,a);return c[0]||c[1]?{bb:a,Xe:c[1]}:null}
	function Jj(a,b){var c=a.reduce(function(a,b){return a<<1|(0==b.sb?0:1)},0),d=b.f.reduce(function(a,b){return a<<1|(0==b.sb?0:1)},0),c=c^d;return[0==c,c==Math.pow(2,Math.max(a.length,b.f.length))-1]};function Kj(a,b,c){this.Ha=a;this.le=b;this.Yb=c}Kj.prototype.jc=function(){this.Yb.forEach(function(a){this.Ha=a.gb(this.Ha,this.le)},this);return this.Ha};function Lj(a){S.call(this,0,1);this.U=a}r(Lj,S);Lj.prototype.toString=function(){return"update("+this.U.getName()+")"};Lj.prototype.ca=function(a,b,c){a=a[0].entries.map(function(a){var b=this.U.mb(a.va.Ja());c.set.forEach(function(a){b.m[a.J.getName()]=a.value},this);return b},this);b.update(this.U,a);return[Hd()]};function Mj(a){this.c=a;this.se=[new Qi,new hj(this.c),new zj(this.c),new Ej(this.c),new xj,new Ji(this.c)];this.Rd=[new hj(this.c)]}Mj.prototype.create=function(a,b){var c=a.ab();if(c instanceof nh||c instanceof mh)return Nj(this,a,b);if(c instanceof th||c instanceof xh||c instanceof yh)return Nj(this,a,b,this.se);if(c instanceof oh||c instanceof ph)return Nj(this,a,b,this.Rd);throw new D(8);};
	function Nj(a,b,c,d){a=zg(b.ab(),a.vg.bind(a));null!=d&&(a=(new Kj(a,c,d)).jc());return new ve(a,b.da())}
	Mj.prototype.vg=function(a){if(a instanceof th)return new uj(a.f,a.Sb);if(a instanceof wh)return new Ki(a.f);if(a instanceof vh)return new ah(a.f);if(a instanceof uh)return new oj(a.N);if(a instanceof yh)return new wj;if(a instanceof xh)return new nj;if(a instanceof qh)return new fj(a.O.W());if(a instanceof sh)return new Fh;if(a instanceof zh)return new Mi(this.c,a.O,a.Ub);if(a instanceof rh)return new Ii(this.c,a.table);if(a instanceof oh)return new Gi(a.table);if(a instanceof ph)return new Lj(a.table);
	if(a instanceof nh)return new mj(this.c,a.table);if(a instanceof mh)return new kj(this.c,a.table);throw new D(514);};function Oj(a){this.sg=new Fi;this.Gg=new Mj(a)};function Pj(){this.df=x()}function Qj(a,b){var c=a.df.get(b.getName())||null;null===c&&(c=new Rj,a.df.set(b.getName(),c));return c}function Sj(a,b,c,d){c.forEach(function(a){a=Qj(this,a);0==d?(a.eb=null,a.zc=b):3==d?(null===a.ac&&(a.ac=A()),a.ac.add(b),null===a.Xa&&(a.Xa=A()),a.Xa.delete(b)):1==d?(null===a.Xa&&(a.Xa=A()),a.Xa.add(b)):2==d&&(a.eb=b)},a)}
	function Tj(a,b,c,d){var e=!0;c.forEach(function(a){if(e){a=Qj(this,a);var c=null===a.Xa||0==a.Xa.size;e=0==d?(null===a.ac||0==a.ac.size)&&c&&null===a.zc&&null!==a.eb&&a.eb==b:3==d?null===a.zc&&null===a.eb&&null!==a.Xa&&a.Xa.has(b):1==d?null===a.eb:c&&(null===a.eb||a.eb==b)}},a);return e}function Uj(a,b,c,d){var e=Tj(a,b,c,d);e&&Sj(a,b,c,d);return e}Pj.prototype.releaseLock=function(a,b){b.forEach(function(b){Qj(this,b).releaseLock(a)},this)};
	function Vj(a,b){b.forEach(function(a){Qj(this,a).eb=null},a)}function Rj(){this.ac=this.Xa=this.eb=this.zc=null}Rj.prototype.releaseLock=function(a){this.zc==a&&(this.zc=null);this.eb==a&&(this.eb=null);null===this.Xa||this.Xa.delete(a);null===this.ac||this.ac.delete(a)};function Wj(){this.Xb=new Xj;this.Hc=new Pj}function De(a,b){(2>b.getPriority()||2>b.getPriority())&&Vj(a.Hc,b.da());a.Xb.Db(b);Yj(a);return b.Rb().ha}function Yj(a){for(var b=a.Xb.ra(),c=0;c<b.length;c++){var d=b[c],e=!1;if(e=0==d.I()?Zj(a,d,1,3):Zj(a,d,2,0))a.Xb.remove(d),e=a,d.exec().then(e.Dg.bind(e,d),e.Cg.bind(e,d))}}function Zj(a,b,c,d){var e=!1;Uj(a.Hc,b.W(),b.da(),c)&&(e=Uj(a.Hc,b.W(),b.da(),d));return e}Wj.prototype.Dg=function(a,b){this.Hc.releaseLock(a.W(),a.da());a.Rb().resolve(b);Yj(this)};
	Wj.prototype.Cg=function(a,b){this.Hc.releaseLock(a.W(),a.da());a.Rb().reject(b);Yj(this)};function Xj(){this.Xb=[]}Xj.prototype.Db=function(a){Bf(this.Xb,a,function(a,c){var d=a.getPriority()-c.getPriority();return 0==d?a.W()-c.W():d})};Xj.prototype.ra=function(){return this.Xb.slice()};Xj.prototype.remove=function(a){var b=this.Xb;a=xa(b,a);var c;(c=0<=a)&&Array.prototype.splice.call(b,a,1);return c};function ak(){this.Qc=x()}var bk;function ck(){bk||(bk=new ak);return bk}ak.prototype.clear=function(){this.Qc.clear()};ak.prototype.clear=ak.prototype.clear;ak.prototype.ub=function(a,b){this.Qc.set(a.toString(),b);return b};ak.prototype.registerService=ak.prototype.ub;ak.prototype.b=function(a){var b=this.Qc.get(a.toString())||null;if(null===b)throw new D(7,a.toString());return b};ak.prototype.getService=ak.prototype.b;ak.prototype.pd=function(a){return this.Qc.has(a.toString())};
	ak.prototype.isRegistered=ak.prototype.pd;function dk(){var a=ck();return $b(a.Qc)};function ek(a,b,c,d){return null!=a?null!=b?fk(a,b,c,d):gk(a):hk()}function ik(a){var b="";try{b=JSON.stringify(a)}catch(c){}return b}function jk(a){var b=ck();a=new oc("ns_"+a);return b.pd(a)?b.b(a):null}function hk(){var a={};dk().forEach(function(b){"ns_"==b.substring(0,3)&&(b=b.substring(3),a[b]=jk(b).b(vc).version())});return ik(a)}function gk(a){a=jk(a);var b={};if(null!=a){var c=a.b(rc);a.b(vc).pa().forEach(function(a){b[a.getName()]=c.get(ff(a)).Y().ia})}return ik(b)}
	function fk(a,b,c,d){var e=jk(a);a=[];if(null!=e){var f=null;try{f=e.b(vc).table(b)}catch(h){}null!=f&&(b=e.b(rc),e=e.b(qc),c=b.get(ff(f)).Ua(void 0,!1,c,d),c.length&&(a=yf(e,c).map(function(a){return a.m})))}return ik(a)};function kk(a,b){this.Sd=Zd();this.me=a;this.rd=b;this.K=lk(this)}function lk(a){if(0<a.me.f.length)return a.me.f;var b=[];a.me.from.forEach(function(a){a.nb().forEach(function(a){b.push(a)})});return b}kk.prototype.$=function(a,b){return this.K.every(function(c){return $d(this.Sd,c.I(),"eq")(H(a,c),H(b,c))},this)};
	function mk(a,b,c){var d=null===b?[]:b.entries,e=qb(d,c.entries,a.$.bind(a),function(a){return d[a]});b=[];for(var f=0,h=0;h<d.length;h++){var k=d[h];e[f]==k?f++:(k=a.rd.splice(f,1),k=nk(h,k,0,a.rd),b.push(k))}e=qb(d,c.entries,a.$.bind(a),function(a,b){return c.entries[b]});for(h=f=0;h<c.entries.length;h++)k=c.entries[h],e[f]==k?f++:(a.rd.splice(h,0,k.va.m),k=nk(h,[],1,a.rd),b.push(k));return b}function nk(a,b,c,d){return{addedCount:c,index:a,object:d,removed:b,type:"splice"}};function ok(){this.ic=x()}ok.prototype.Ed=function(a,b){var c=ka(a.query).toString(),d=this.ic.get(c)||null;null===d&&(d=new pk(a),this.ic.set(c,d));d.Ed(b)};ok.prototype.ne=function(a,b){var c=ka(a.query).toString(),d=this.ic.get(c)||null;d.ne(b);0<d.Kc.size||this.ic.delete(c)};function Ce(a,b){var c=A();b.forEach(function(a){c.add(a.getName())});var d=[];a.ic.forEach(function(a){a=a.Ec();a.context.from.some(function(a){return c.has(a.getName())})&&d.push(a)});return d}
	function Ae(a,b,c){b=ka(null!=b.Zc?b.Zc:b).toString();a=a.ic.get(b)||null;null!==a&&qk(a,c)}function pk(a){this.Jf=a;this.Kc=A();this.Ag=[];this.bf=null;this.Uf=new kk(a.query,this.Ag)}pk.prototype.Ed=function(a){this.Kc.has(a)||this.Kc.add(a)};pk.prototype.ne=function(a){return this.Kc.delete(a)};pk.prototype.Ec=function(){var a=this.Jf;return{context:a.query,ke:di(a)}};function qk(a,b){var c=mk(a.Uf,a.bf,b);a.bf=b;0<c.length&&a.Kc.forEach(function(a){a(c)})};function rk(a,b){var c=a.b(vc),d=b||{},e=new xf(c);a.ub(qc,e);var e=null,f=!1;null!=d.storeType?e=d.storeType:(e=Yb(),e=e.hg?0:e.Wg?4:1);switch(e){case 0:e=new bf(a,c);break;case 1:e=new jf(c);break;case 5:e=new mf(c);break;case 4:e=new uf(a,c,d.webSqlDbSize);break;case 3:e=new Pe(c,d.firebase);f=!0;break;default:throw new D(300);}a.ub(pc,e);var h=new yg;a.ub(rc,h);return e.Ea(d.onUpgrade).then(function(){var b=new Oj(a);a.ub(sc,b);b=new Wj;a.ub(tc,b);b=new ok;a.ub(uc,b);return h.Ea(c)}).then(function(){if(f){var b=
	new Ee(a);b.Na.subscribe(b.fe.bind(b))}d.enableInspector&&(window.top["#lfInspect"]=ek);return(new rg(a)).Ea(c)})};function sk(a){this.c=a;this.g=a.b(vc);this.aa=A(this.g.pa());this.fb=fb()}function tk(a){var b=a.c.b(rc),c=a.c.b(qc),d={};a.g.pa().forEach(function(a){var f=b.get(ff(a)).Ua(),f=yf(c,f).map(function(a){return a.m});d[a.getName()]=f});return{name:a.g.name(),version:a.g.version(),tables:d}}m=sk.prototype;m.exec=function(){var a=tk(this),a=new Ld(new ac(-1,a),!0);return v([new G([a],[])])};m.I=l(0);m.da=g("aa");m.Rb=g("fb");m.W=function(){return ka(this)};m.getPriority=l(0);function uk(a,b){this.c=a;this.g=a.b(vc);this.aa=A(this.g.pa());this.fb=fb();this.Ba=b;this.Na=a.b(pc);this.V=a.b(qc);this.D=a.b(rc)}m=uk.prototype;
	m.exec=function(){if(!(this.Na instanceof bf||this.Na instanceof jf||this.Na instanceof uf))throw new D(300);var a;a:{a=this.g.pa();for(var b=0;b<a.length;++b)if(0<this.D.get(ff(a[b])).Y().ia){a=!1;break a}a=!0}if(!a)throw new D(110);if(this.g.name()!=this.Ba.name||this.g.version()!=this.Ba.version)throw new D(111);if(null==this.Ba.tables)throw new D(112);return vk(this)};m.I=l(1);m.da=g("aa");m.Rb=g("fb");m.W=function(){return ka(this)};m.getPriority=l(0);
	function vk(a){var b=new od(a.c,a.aa),b=a.Na.Hb(a.I(),C(a.aa),b),c;for(c in a.Ba.tables){var d=a.g.table(c),e=a.Ba.tables[c].map(function(a){return d.Ab(a)}),f=b.H(c,d.mb,0);a.V.Zb(c,e);var h=a.D.oc.get(c)||[];e.forEach(function(a){h.forEach(function(b){var c=a.pb(b.getName());b.add(c,a.id())})});f.put(e)}return b.ka()};function wk(a,b){this.c=a;this.Na=a.b(pc);this.Ia=a.b(tc);this.Lb=a.b(uc);this.aa=A(b);this.Qa=new od(this.c,this.aa);this.fb=fb();this.Ac=fb();this.Ae=fb()}m=wk.prototype;m.exec=function(){this.Ae.resolve();return this.Ac.ha};m.I=l(1);m.da=g("aa");m.Rb=g("fb");m.W=function(){return ka(this)};m.getPriority=l(2);function xk(a){De(a.Ia,a);return a.Ae.ha}
	function yk(a,b){var c=b.Ec();return c.ke.ab().exec(a.Qa,c.context).then(function(a){return Dd(a[0])},function(a){this.Qa.Mb();var b=new kb(a.name);this.Ac.reject(b);throw a;}.bind(a))}m.ka=function(){this.ja=this.Na.Hb(this.I(),C(this.aa),this.Qa);this.ja.ka().then(function(){this.Pc();this.Ac.resolve()}.bind(this),function(a){this.Qa.Mb();this.Ac.reject(a)}.bind(this));return this.fb.ha};m.Mb=function(){this.Qa.Mb();this.Ac.resolve();return this.fb.ha};
	m.Pc=function(){var a=Ce(this.Lb,this.aa);0!=a.length&&(a=new ze(this.c,a),De(this.Ia,a))};m.Y=function(){var a=null;null!=this.ja&&(a=this.ja.Y());return null===a?new z(!1,0,0,0,0):a};function V(a){this.c=a;this.Ia=a.b(tc);this.Nb=null;this.Sa=0;0==zk.size&&(zk.set(0,A([1,4])),zk.set(1,A([2])),zk.set(2,A([3,5,6])),zk.set(3,A([2,7])),zk.set(4,A([7])),zk.set(5,A([7])),zk.set(6,A([7])))}q("lf.proc.Transaction",V);var zk=x();function Ak(a,b){var c=zk.get(a.Sa)||null;if(null===c||!c.has(b))throw new D(107,a.Sa,b);a.Sa=b}
	V.prototype.exec=function(a){Ak(this,4);var b=[];try{a.forEach(function(a){a.kb();b.push(a.Ec())},this)}catch(c){return Ak(this,7),bb(c)}this.Nb=new Gh(this.c,b);return De(this.Ia,this.Nb).then(function(a){Ak(this,7);return a.map(function(a){return Dd(a)})}.bind(this),function(a){Ak(this,7);throw a;}.bind(this))};V.prototype.exec=V.prototype.exec;V.prototype.Hf=function(a){Ak(this,1);this.Nb=new wk(this.c,a);return xk(this.Nb).then(function(){Ak(this,2)}.bind(this))};V.prototype.begin=V.prototype.Hf;
	V.prototype.Gf=function(a){Ak(this,3);return yk(this.Nb,a).then(function(a){Ak(this,2);return a}.bind(this),function(a){Ak(this,7);throw a;}.bind(this))};V.prototype.attach=V.prototype.Gf;V.prototype.ka=function(){Ak(this,5);return this.Nb.ka().then(function(){Ak(this,7)}.bind(this))};V.prototype.commit=V.prototype.ka;V.prototype.Mb=function(){Ak(this,6);return this.Nb.Mb().then(function(){Ak(this,7)}.bind(this))};V.prototype.rollback=V.prototype.Mb;
	V.prototype.Y=function(){if(7!=this.Sa)throw new D(105);return this.Nb.Y()};V.prototype.stats=V.prototype.Y;function W(a){this.c=a;this.g=a.b(vc);this.ld=!1}q("lf.proc.Database",W);W.prototype.Ea=function(a){this.c.ub(vc,this.g);return rk(this.c,a).then(function(){this.ld=!0;this.Ia=this.c.b(tc);return this}.bind(this))};W.prototype.init=W.prototype.Ea;W.prototype.Cb=g("g");W.prototype.getSchema=W.prototype.Cb;function Bk(a){if(!a.ld)throw new D(2);}W.prototype.select=function(a){Bk(this);return new U(this.c,1!=arguments.length||null!=arguments[0]?Array.prototype.slice.call(arguments):[])};
	W.prototype.select=W.prototype.select;W.prototype.Db=function(){Bk(this);return new fi(this.c)};W.prototype.insert=W.prototype.Db;W.prototype.Yd=function(){Bk(this);return new fi(this.c,!0)};W.prototype.insertOrReplace=W.prototype.Yd;W.prototype.update=function(a){Bk(this);return new pi(this.c,a)};W.prototype.update=W.prototype.update;W.prototype.delete=function(){Bk(this);return new ei(this.c)};W.prototype["delete"]=W.prototype.delete;
	W.prototype.observe=function(a,b){Bk(this);this.c.b(uc).Ed(a,b)};W.prototype.observe=W.prototype.observe;W.prototype.unobserve=function(a,b){Bk(this);this.c.b(uc).ne(a,b)};W.prototype.unobserve=W.prototype.unobserve;W.prototype.Qf=function(){Bk(this);return new V(this.c)};W.prototype.createTransaction=W.prototype.Qf;W.prototype.close=function(){try{this.c.b(pc).close()}catch(a){}this.c.clear();this.ld=!1};W.prototype.close=W.prototype.close;
	W.prototype.$f=function(){Bk(this);var a=new sk(this.c);return De(this.Ia,a).then(function(a){return Dd(a[0])[0]})};W.prototype["export"]=W.prototype.$f;W.prototype.import=function(a){Bk(this);a=new uk(this.c,a);return De(this.Ia,a).then(l(null))};W.prototype["import"]=W.prototype.import;function X(a,b,c,d,e,f){this.U=a;this.A=b;this.Ye=c;this.We=d;this.zf=e;this.jb=f||null}q("lf.schema.BaseColumn",X);m=X.prototype;m.getName=g("A");m.j=function(){return Nd(this.U)+"."+this.A};m.toString=function(){return this.j()};m.H=g("U");m.I=g("zf");X.prototype.getType=X.prototype.I;X.prototype.$a=g("jb");X.prototype.Da=function(){null==this.ta&&(this.ta=[],this.H().Da().forEach(function(a){-1!=a.f.map(function(a){return a.ba.getName()}).indexOf(this.A)&&this.ta.push(a)},this));return this.ta};
	X.prototype.Ca=function(){if(!p(this.fa)){var a=this.Da().filter(function(a){return 1!=a.f.length?!1:a.f[0].ba.getName()==this.getName()},this);this.fa=0<a.length?a[0]:null}return this.fa};X.prototype.kc=g("We");X.prototype.isNullable=X.prototype.kc;X.prototype.Gc=g("Ye");X.prototype.Pa=function(a){return Rg(this,a,"eq")};X.prototype.eq=X.prototype.Pa;X.prototype.ef=function(a){return Rg(this,a,"neq")};X.prototype.neq=X.prototype.ef;X.prototype.tg=function(a){return Rg(this,a,"lt")};
	X.prototype.lt=X.prototype.tg;X.prototype.ug=function(a){return Rg(this,a,"lte")};X.prototype.lte=X.prototype.ug;X.prototype.cg=function(a){return Rg(this,a,"gt")};X.prototype.gt=X.prototype.cg;X.prototype.dg=function(a){return Rg(this,a,"gte")};X.prototype.gte=X.prototype.dg;X.prototype.match=function(a){return Rg(this,a,"match")};X.prototype.match=X.prototype.match;X.prototype.If=function(a,b){return Rg(this,[a,b],"between")};X.prototype.between=X.prototype.If;
	X.prototype.eg=function(a){return Rg(this,a,"in")};X.prototype["in"]=X.prototype.eg;X.prototype.og=function(){return this.Pa(null)};X.prototype.isNull=X.prototype.og;X.prototype.ng=function(){return this.ef(null)};X.prototype.isNotNull=X.prototype.ng;X.prototype.uc=function(a){return new X(this.U,this.A,this.Ye,this.We,this.zf,a)};X.prototype.as=X.prototype.uc;function Ck(a){this.g=a;this.Kd=new Xc;this.oe=new Xc;this.gf=new Xc;this.Je=x();this.h=new Xc;this.Fe=new Xc;this.pf=new Xc;this.Ie=new Xc;Dk(this)}function Dk(a){a.g.pa().forEach(function(a){var c=a.getName();a.Jb().Xd().forEach(function(d){this.gf.set(c,this.g.table(d.Wa));this.h.set(d.Wa,a);0==d.action?(this.oe.set(d.Wa,d),this.pf.set(d.Wa,a)):(this.Kd.set(d.Wa,d),this.Fe.set(d.Wa,a));this.Je.set(a.getName()+"."+d.yb,d.Wa);this.Ie.set(d.Wa+"."+d.Mc,a.getName())},this)},a)}
	function ed(a,b,c){if(null!=c)return 1==c?a.Kd.get(b):a.oe.get(b);c=a.Kd.get(b);a=a.oe.get(b);return null===c&&null===a?null:(c||[]).concat(a||[])}function Mh(a,b){var c=b.get(a);return null===c?[]:c}function Oh(a,b){var c=A();b.forEach(function(a){(a=this.Je.get(a))&&c.add(a)},a);return C(c).map(function(a){return this.g.table(a)},a)}function Kh(a,b,c){return null!=c?0==c?Mh(b,a.pf):Mh(b,a.Fe):Mh(b,a.h)}
	function Ph(a,b){var c=A();b.forEach(function(a){(a=this.Ie.get(a))&&a.forEach(function(a){c.add(a)})},a);return C(c).map(function(a){return this.g.table(a)},a)};function Ek(a,b,c){this.Hg=a;this.zg=b;this.ag=c}q("lf.schema.Constraint",Ek);Ek.prototype.ed=g("Hg");Ek.prototype.getPrimaryKey=Ek.prototype.ed;Ek.prototype.Xd=g("ag");Ek.prototype.getForeignKeys=Ek.prototype.Xd;function Fk(a,b,c){var d=a.ref.split(".");if(2!=d.length)throw new D(540,c);this.He=b;this.yb=a.local;this.Wa=d[0];this.Mc=d[1];this.name=b+"."+c;this.action=a.action;this.timing=a.timing};function Y(a){Gk(a);this.Sd=Zd();this.A=a;this.K=x();this.Bd=A();this.qc=A();this.qd=A();this.Fa=null;this.ta=x();this.ud=!1;this.Bb=[]}q("lf.schema.TableBuilder",Y);function Hk(a){this.name=a.name;this.sb=a.order;this.autoIncrement=a.autoIncrement}var Ik=A([0,6]);function Gk(a){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(a))throw new D(502,a);}function Jk(a,b){if(b==a.A)throw new D(546,b);if(a.K.has(b)||a.ta.has(b)||a.qc.has(b))throw new D(503,a.A+"."+b);}
	function Kk(a,b){var c=!1;b.forEach(function(a){var b=this.K.get(a.name);c=c||a.autoIncrement;if(a.autoIncrement&&3!=b)throw new D(504);},a);if(c&&1<b.length)throw new D(505);}function Lk(a){if(null!==a.Fa){var b=a.ta.get(a.Fa).map(function(a){return a.name}),c=0;if(a.Bb.some(function(a,e){c=e;return-1!=b.indexOf(a.yb)},a))throw new D(543,a.Bb[c].name);}}
	function Mk(a){if(null!==a.Fa){var b=function(a){return a.name},c=JSON.stringify(a.ta.get(a.Fa).map(b));a.ta.forEach(function(a,e){if(e!=this.Fa){var f=a.map(b);if(JSON.stringify(f)==c)throw new D(544,this.A+"."+e);}},a)}}function Nk(a){null===a.Fa||a.ta.get(a.Fa).forEach(function(a){if(this.qd.has(a.name))throw new D(545,this.A+"."+a.name);},a)}Y.prototype.Bf=function(a,b){Gk(a);Jk(this,a);this.K.set(a,b);Ik.has(b)&&this.Ce([a]);return this};Y.prototype.addColumn=Y.prototype.Bf;
	Y.prototype.Df=function(a,b){var c=this.A;this.Fa="pk"+(c[0].toUpperCase()+c.substring(1));Gk(this.Fa);Jk(this,this.Fa);c=Ok(this,a,!0,void 0,b);Kk(this,c);1==c.length&&this.Bd.add(c[0].name);this.qc.add(this.Fa);this.ta.set(this.Fa,c);return this};Y.prototype.addPrimaryKey=Y.prototype.Df;
	Y.prototype.Cf=function(a,b){Gk(a);Jk(this,a);var c=new Fk(b,this.A,a);p(c.action)||(c.action=0);p(c.timing)||(c.timing=0);if(1==c.action&&1==c.timing)throw new D(506);if(!this.K.has(c.yb))throw new D(540,a);this.Bb.push(c);this.Be(a,[c.yb],this.Bd.has(c.yb));return this};Y.prototype.addForeignKey=Y.prototype.Cf;Y.prototype.Ef=function(a,b){Gk(a);Jk(this,a);var c=Ok(this,b,!0);1==c.length&&(this.Bd.add(c[0].name),Pk(this,c[0].name));this.ta.set(a,c);this.qc.add(a);return this};
	Y.prototype.addUnique=Y.prototype.Ef;function Pk(a,b){a.Bb.forEach(function(a){a.yb==b&&this.qc.add(a.name.split(".")[1])},a)}Y.prototype.Ce=function(a){Ok(this,a,!1).forEach(function(a){this.qd.add(a.name)},this);return this};Y.prototype.addNullable=Y.prototype.Ce;Y.prototype.Be=function(a,b,c,d){Gk(a);Jk(this,a);b=Ok(this,b,!0,d);c&&this.qc.add(a);this.ta.set(a,b);return this};Y.prototype.addIndex=Y.prototype.Be;Y.prototype.Fb=ba("ud");Y.prototype.persistentIndex=Y.prototype.Fb;
	Y.prototype.Cb=function(){Lk(this);Mk(this);Nk(this);return new (Qk(this))};Y.prototype.getSchema=Y.prototype.Cb;function Ok(a,b,c,d,e){var f=b,f="string"==typeof b[0]?b.map(function(a){return new Hk({name:a,order:null!=d?d:1,autoIncrement:e||!1})}):b.map(function(a){return new Hk(a)});f.forEach(function(a){if(!this.K.has(a.name))throw new D(508,this.A,a.name);if(c){var b=this.K.get(a.name);if(0==b||6==b)throw new D(509,this.A,a.name);}},a);return f}
	function Qk(a){function b(){function b(c){return a.ta.get(c).map(function(a){return{ba:this[a.name],sb:a.sb,autoIncrement:a.autoIncrement}},this)}var d=$b(a.K).map(function(b){this[b]=new X(this,b,a.Bd.has(b),a.qd.has(b),a.K.get(b));return this[b]},this),e=$b(a.ta).map(function(d){return new Tg(a.A,d,a.qc.has(d),b.call(this,d))},this);Q.call(this,a.A,d,e,a.ud);var f=null===a.Fa?null:new Tg(a.A,a.Fa,!0,b.call(this,a.Fa)),h=d.filter(function(b){return!a.qd.has(b.getName())});this.Nf=new Ek(f,h,a.Bb);
	this.sf=Rk(a,d,e)}r(b,Q);b.prototype.Ab=function(a){return new this.sf(bc++,a)};b.prototype.createRow=b.prototype.Ab;b.prototype.mb=function(a){var b={};this.nb().forEach(function(e){var f=e.getName();e=e.I();var h=a.value[f];if(0==e)if(e=h,null!=e&&""!=e){0!=e.length%2&&(e="0"+e);for(var h=new ArrayBuffer(e.length/2),k=new Uint8Array(h),n=0,B=0;n<e.length;n+=2)k[B++]=parseInt(e.substr(n,2),16);e=h}else e=null;else e=2==e?null!=h?new Date(h):null:h;b[f]=e},this);return new this.sf(a.id,b)};b.prototype.deserializeRow=
	b.prototype.mb;b.prototype.Jb=g("Nf");b.prototype.getConstraint=b.prototype.Jb;return b}
	function Rk(a,b,c){function d(a,d){this.K=b;this.ta=c;ac.call(this,a,d)}r(d,ac);d.prototype.Le=function(){var a={};this.K.forEach(function(b){a[b.getName()]=b.kc()?null:Wc[b.I()]});return a};d.prototype.yf=function(){var a={};this.K.forEach(function(b){var c=b.getName();b=b.I();var d=this.m[c];a[c]=0==b?null!=d?fc(d):null:2==b?null!=d?d.getTime():null:6==b?null!=d?d:null:d},this);return a};var e=function(a){var b=this.K.get(a.getName()),c=this.Sd.Ze.get(b)||null;return function(b){return c(b[a.getName()])}}.bind(a),
	f=function(a){var b=a.map(function(a){return e(a.ba)});return function(a){return b.map(function(b){return b(a)})}}.bind(a),h={};c.forEach(function(a){var b=a.j();a=1==a.f.length?e(a.f[0].ba):f(a.f);h[b]=a});d.prototype.pb=function(a){return-1!=a.indexOf("#")?this.id():h.hasOwnProperty(a)?h[a](this.m):null};return d};function Sk(a,b){this.g=new Z(a,b);this.wb=x();this.Bc=!1;this.i=null}q("lf.schema.Builder",Sk);function Tk(a,b){b.Bb.forEach(function(a){var d=a.Wa;if(!this.wb.has(d))throw new D(536,a.name);var d=this.wb.get(d).Cb(),e=a.Mc;if(!d.hasOwnProperty(e))throw new D(537,a.name);if(b.Cb()[a.yb].I()!=d[e].I())throw new D(538,a.name);if(!d[e].Gc())throw new D(539,a.name);},a)}
	Sk.prototype.Mf=function(a){a.Bb.forEach(function(a){this.wb.get(a.Wa).Bb.forEach(function(c){if(c.yb==a.Mc)throw new D(534,a.name);},this)},this)};function Uk(a){a.Bc||(a.wb.forEach(function(a){Tk(this,a);a=a.Cb();this.g.M.set(a.getName(),a)},a),y(a.wb).forEach(a.Mf,a),Vk(a),a.wb.clear(),a.Bc=!0)}function Wk(a,b,c){b.ze||(b.ze=!0,b.ge=!0,b.Me.forEach(function(a){a=c.get(a);if(!a.ze)Wk(this,a,c);else if(a.ge&&b!=a)throw new D(533);},a));b.ge=!1}
	function Vk(a){var b=x();a.g.M.forEach(function(a,d){b.set(d,new Xk(d))},a);a.wb.forEach(function(a,d){a.Bb.forEach(function(a){b.get(a.Wa).Me.add(d)})});y(b).forEach(function(a){Wk(this,a,b)},a)}function Xk(a){this.ge=this.ze=!1;this.Me=A();this.pc=a}Sk.prototype.Cb=function(){this.Bc||Uk(this);return this.g};Sk.prototype.getSchema=Sk.prototype.Cb;Sk.prototype.Qe=function(){var a=new oc("ns_"+this.g.name()),b=ck(),c=null;b.pd(a)?c=b.b(a):(c=new ak,b.ub(a,c));return c};Sk.prototype.getGlobal=Sk.prototype.Qe;
	Sk.prototype.connect=function(a){if(null!==this.i&&this.i.ld)throw new D(113);if(null===this.i){var b=this.Qe();b.pd(vc)||b.ub(vc,this.Cb());this.i=new W(b)}return this.i.Ea(a)};Sk.prototype.connect=Sk.prototype.connect;Sk.prototype.Pf=function(a){if(this.wb.has(a))throw new D(503,a);if(this.Bc)throw new D(535);this.wb.set(a,new Y(a));return this.wb.get(a)};Sk.prototype.createTable=Sk.prototype.Pf;Sk.prototype.te=function(a){if(this.Bc)throw new D(535);this.g.te(a);return this};
	Sk.prototype.setPragma=Sk.prototype.te;function Z(a,b){this.A=a;this.Ta=b;this.M=x();this.lf={Vf:!1}}q("lf.schema.DatabaseSchema",Z);Z.prototype.name=g("A");Z.prototype.name=Z.prototype.name;Z.prototype.version=g("Ta");Z.prototype.version=Z.prototype.version;Z.prototype.pa=function(){return y(this.M)};Z.prototype.tables=Z.prototype.pa;Z.prototype.table=function(a){if(!this.M.has(a))throw new D(101,a);return this.M.get(a)};Z.prototype.table=Z.prototype.table;
	Z.prototype.info=function(){this.Ve||(this.Ve=new Ck(this));return this.Ve};Z.prototype.kf=g("lf");Z.prototype.pragma=Z.prototype.kf;Z.prototype.te=ba("lf");q("lf.schema.create",function(a,b){return new Sk(a,b)});u.prototype.catch=u.prototype.we;u.prototype["catch"]=u.prototype.catch;
	try{if(module){module.exports=lf;}}catch(e){}}.bind(window))()
	//# sourceMappingURL=lovefield.min.js.map

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)(module)))

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }
/******/ ]);