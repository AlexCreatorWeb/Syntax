// Node.js sandbox-шимы для раннера (browser-версия встроенных модулей + mini-Express + моки pg/mongodb).
// Источник: node-shims.js (screenshot-tool). Экспортируется строкой — раннер вставляет как классический <script>.
// ВНИМАНИЕ: строка — template literal, поэтому все бэкслэши источника удвоены (\\s = \s в рантайме).
// Всё живёт в globalThis.__shims / globalThis.process / window.__request.
export const NODE_SHIMS_SRC = `
// Syntax Node.js runner — sandbox-шимы (browser). Классический скрипт: всё в globalThis.__shims.
// Реализация API-совместимого подмножества для уроков курса (в терминале — настоящие пакеты).
(function () {
  "use strict";

  // ---------- process ----------
  var process = {
    env: {
      NODE_ENV: "sandbox",
      PORT: "3000",
      JWT_SECRET: "syntax-dev-secret",
      DATABASE_URL: "postgres://user:pass@localhost:5432/syntax",
      MONGO_URL: "mongodb://localhost:27017/syntax",
    },
    argv: ["node", "server.js"],
    version: "v20.11.0 (browser-sandbox)",
    platform: "linux",
    cwd: function () { return "/app"; },
    exit: function (code) { console.log("[sandbox] process.exit(" + code + ")"); },
    hrtime: function () { return [0, performance.now() * 1e6]; },
  };
  // process.on/once — минимальный
  var processListeners = {};
  process.on = function (ev, fn) { (processListeners[ev] = processListeners[ev] || []).push(fn); return process; };
  process.once = process.on;
  process.emit = function (ev) { var args = Array.prototype.slice.call(arguments, 1); (processListeners[ev] || []).forEach(function (fn) { fn.apply(null, args); }); };
  process.nextTick = function (fn) { var a = Array.prototype.slice.call(arguments, 1); queueMicrotask(function () { fn.apply(null, a); }); };
  globalThis.process = process;

  var shims = {};
  globalThis.__shims = shims;

  // ---------- маленький EventEmitter (внутренний, для req/res/streams) ----------
  function MiniEE() { this.__ee = {}; }
  MiniEE.prototype.on = function (ev, fn) { (this.__ee[ev] = this.__ee[ev] || []).push(fn); return this; };
  MiniEE.prototype.once = function (ev, fn) {
    var self = this;
    var wrap = function () { self.off(ev, wrap); fn.apply(null, arguments); };
    return this.on(ev, wrap);
  };
  MiniEE.prototype.off = function (ev, fn) {
    var l = this.__ee[ev]; if (!l) return this;
    this.__ee[ev] = l.filter(function (f) { return f !== fn; });
    return this;
  };
  MiniEE.prototype.emit = function (ev) {
    var args = Array.prototype.slice.call(arguments, 1);
    var l = (this.__ee[ev] || []).slice();
    l.forEach(function (fn) { fn.apply(null, args); });
    return true;
  };
  shims.MiniEE = MiniEE;

  // ---------- posix path ----------
  function norm(p) {
    var parts = p.split("/");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i];
      if (s === "" || s === ".") continue;
      if (s === "..") { if (out.length && out[out.length - 1] !== "..") out.pop(); else if (!p.startsWith("/")) out.push(".."); }
      else out.push(s);
    }
    var res = out.join("/");
    if (p.startsWith("/")) res = "/" + res;
    return res || (p.startsWith("/") ? "/" : ".");
  }
  shims.path = {
    sep: "/",
    isAbsolute: function (p) { return p.startsWith("/"); },
    normalize: norm,
    join: function () { return norm(Array.prototype.slice.call(arguments).join("/")); },
    resolve: function () {
      var a = Array.prototype.slice.call(arguments);
      if (!a.length) return "/app";
      var p = a[0];
      if (!shims.path.isAbsolute(p)) p = "/app/" + p;
      return norm(a.join("/"));
    },
    relative: function (from, to) {
      var f = shims.path.resolve(from).split("/"), t = shims.path.resolve(to).split("/");
      while (f.length && t.length && f[0] === t[0]) { f.shift(); t.shift(); }
      f.forEach(function () { t.unshift(".."); });
      return t.join("/");
    },
    dirname: function (p) { var i = p.lastIndexOf("/"); return i <= 0 ? (p.startsWith("/") ? "/" : ".") : p.slice(0, i); },
    basename: function (p, ext) { var b = p.split("/").pop(); if (ext && b.endsWith(ext)) b = b.slice(0, -ext.length); return b; },
    extname: function (p) { var b = p.split("/").pop(); var i = b.lastIndexOf("."); return i <= 0 ? "" : b.slice(i); },
    parse: function (p) {
      var b = shims.path.basename(p); var i = b.lastIndexOf(".");
      var name = i <= 0 ? b : b.slice(0, i);
      var ext = i <= 0 ? "" : b.slice(i);
      return { root: p.startsWith("/") ? "/" : "", dir: shims.path.dirname(p), base: b, ext: ext, name: name };
    },
    format: function (o) { return (o.dir || "") + (o.dir && o.base ? "/" : "") + (o.base || (o.name || "") + (o.ext || "")); },
  };

  // ---------- memfs ----------
  var files = Object.create(null); // path -> string
  function ensureDir(p) {
    var parts = p.split("/").filter(Boolean);
    for (var i = 1; i < parts.length; i++) files[parts.slice(0, i).join("/") + "/"] = "";
  }
  function isFile(p) { return Object.prototype.hasOwnProperty.call(files, p) && files[p] !== ""; }
  function isDir(p) { return Object.prototype.hasOwnProperty.call(files, p) && files[p] === ""; }
  shims._files = files;
  shims.fs = {
    readFileSync: function (p) { p = String(p); if (!isFile(p)) { var e = new Error('ENOENT: no such file or directory, open \\'' + p + "'"); e.code = "ENOENT"; throw e; } return files[p]; },
    writeFileSync: function (p, data) { p = String(p); ensureDir(p); files[p] = String(data); },
    appendFileSync: function (p, data) { p = String(p); ensureDir(p); files[p] = (files[p] || "") + String(data); },
    mkdirSync: function (p, opts) { p = String(p).replace(/\\/+$/, "") + "/"; ensureDir(p); files[p] = files[p] !== undefined ? files[p] : ""; },
    readdirSync: function (p) {
      p = String(p).replace(/\\/+$/, "");
      var prefix = p === "" || p === "/" ? "" : p + "/";
      var out = [];
      Object.keys(files).forEach(function (k) {
        if (prefix && !k.startsWith(prefix)) return;
        var rest = k.slice(prefix.length);
        if (!rest || rest.includes("/")) return;
        out.push(rest);
      });
      return out;
    },
    existsSync: function (p) { return Object.prototype.hasOwnProperty.call(files, String(p)); },
    statSync: function (p) { p = String(p); if (!shims.fs.existsSync(p)) { var e = new Error("ENOENT: stat " + p); e.code = "ENOENT"; throw e; } return { isFile: function () { return isFile(p); }, isDirectory: function () { return isDir(p); }, size: isFile(p) ? Buffer.byteLength(files[p]) : 0 }; },
    unlinkSync: function (p) { if (!shims.fs.existsSync(String(p))) { var e = new Error("ENOENT: unlink " + p); e.code = "ENOENT"; throw e; } delete files[String(p)]; },
    accessSync: function (p) { if (!shims.fs.existsSync(String(p))) { var e = new Error("ENOENT: access " + p); e.code = "ENOENT"; throw e; } },
    renameSync: function (a, b) { files[b] = files[a]; delete files[a]; },
    // async-варианты (promise)
    readFile: function (p, enc) { return new Promise(function (res, rej) { try { res(enc ? String(shims.fs.readFileSync(p)) : Buffer.from(shims.fs.readFileSync(p))); } catch (e) { rej(e); } }); },
    writeFile: function (p, data) { return new Promise(function (res, rej) { try { shims.fs.writeFileSync(p, data); res(); } catch (e) { rej(e); } }); },
    appendFile: function (p, data) { return new Promise(function (res, rej) { try { shims.fs.appendFileSync(p, data); res(); } catch (e) { rej(e); } }); },
    mkdir: function (p) { return new Promise(function (res, rej) { try { shims.fs.mkdirSync(p, { recursive: true }); res(); } catch (e) { rej(e); } }); },
    readdir: function (p) { return new Promise(function (res, rej) { try { res(shims.fs.readdirSync(p)); } catch (e) { rej(e); } }); },
    unlink: function (p) { return new Promise(function (res, rej) { try { shims.fs.unlinkSync(p); res(); } catch (e) { rej(e); } }); },
    stat: function (p) { return new Promise(function (res, rej) { try { res(shims.fs.statSync(p)); } catch (e) { rej(e); } }); },
    access: function (p) { return new Promise(function (res, rej) { try { shims.fs.accessSync(p); res(); } catch (e) { rej(e); } }); },
    promises: null, // ниже
    createReadStream: function (p) {
      var data = shims.fs.readFileSync(String(p));
      var r = new shims.Readable();
      queueMicrotask(function () {
        var chunk = 64;
        for (var i = 0; i < data.length; i += chunk) r.push(Buffer.from(data.slice(i, i + chunk)));
        r.push(null);
      });
      return r;
    },
    createWriteStream: function (p) {
      var w = new shims.Writable();
      var chunks = [];
      w.on("data", function (c) { chunks.push(c); });
      w.on("finish", function () { shims.fs.writeFileSync(String(p), Buffer.concat(chunks).toString("utf8")); });
      return w;
    },
  };
  shims.fs.promises = {
    readFile: shims.fs.readFile, writeFile: shims.fs.writeFile, appendFile: shims.fs.appendFile,
    mkdir: shims.fs.mkdir, readdir: shims.fs.readdir, unlink: shims.fs.unlink, stat: shims.fs.stat, access: shims.fs.access,
  };

  // ---------- streams (Readable/Writable/Transform/PassThrough) ----------
  function Readable() {
    MiniEE.call(this);
    var self = this; this.readable = true; this._chunks = []; this._ended = false;
  }
  Readable.prototype = Object.create(MiniEE.prototype);
  Readable.prototype.push = function (chunk) {
    if (chunk === null) { this._ended = true; queueMicrotask(() => this.emit("end")); return false; }
    this._chunks.push(chunk);
    queueMicrotask(() => { if (!this._ended) this.emit("data", chunk); });
    return true;
  };
  Readable.prototype.pipe = function (dest) {
    var self = this;
    this.on("data", function (c) { dest.write(c); });
    this.on("end", function () { dest.end(); });
    this.on("error", function (e) { dest.emit("error", e); });
    return dest;
  };
  Readable.prototype.setEncoding = function () { return this; };
  Readable.prototype._read = function () {};
  function Writable() { MiniEE.call(this); this.writable = true; }
  Writable.prototype = Object.create(MiniEE.prototype);
  Writable.prototype.write = function (chunk) { this.emit("data", chunk); return true; };
  Writable.prototype.end = function (chunk) { if (chunk !== undefined && chunk !== null) this.write(chunk); this.writable = false; queueMicrotask(() => this.emit("finish")); };
  function Transform(opts) {
    Readable.call(this); var self = this; this._in = new Writable();
    this._in.on("data", function (c) { self._transform(c); });
    this._in.on("finish", function () { self._flush(); self.push(null); });
    this.write = function (c) { self._in.write(c); return true; };
    this.end = function (c) { self._in.end(c); return this; };
    this._transform = function (c) { self.push(c); };
    this._flush = function () {};
  }
  Transform.prototype = Object.create(Readable.prototype);
  function PassThrough() { Transform.call(this); }
  PassThrough.prototype = Object.create(Transform.prototype);
  shims.Readable = Readable; shims.Writable = Writable; shims.Transform = Transform; shims.PassThrough = PassThrough;
  shims.stream = { Readable: Readable, Writable: Writable, Transform: Transform, PassThrough: PassThrough, Duplex: Transform };

  // ---------- http mock + __request ----------
  var STATUS_CODES = { 200: "OK", 201: "Created", 204: "No Content", 301: "Moved Permanently", 302: "Found", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed", 409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests", 500: "Internal Server Error" };
  var servers = [];
  shims.__servers = servers;
  function makeRequest(method, url, body, headers) {
    var req = new MiniEE();
    req.method = String(method || "GET").toUpperCase();
    req.url = url; req.originalUrl = url;
    req.headers = Object.assign({}, headers || {});
    Object.keys(req.headers).forEach(function (k) { req.headers[k.toLowerCase()] = req.headers[k]; });
    req.socket = { remoteAddress: "127.0.0.1", destroyed: false };
    req.connection = req.socket;
    req.get = function (h) { return req.headers[String(h).toLowerCase()]; };
    req.setHeader = function (k, v) { req.headers[String(k).toLowerCase()] = v; return req; };
    Object.defineProperty(req, "path", { get: function () { return url.split("?")[0]; } });
    var q = {};
    var qi = url.indexOf("?");
    if (qi >= 0) {
      var sp = new URLSearchParams(url.slice(qi + 1));
      sp.forEach(function (v, k) { q[k] = v; });
    }
    req.query = q;
    req.params = {};
    req.body = undefined;
    req.ip = "127.0.0.1";
    req.aborted = false;
    req.setTimeout = function () { return req; };
    req.setEncoding = function () { return req; };
    return req;
  }
  function makeResponse() {
    var res = new MiniEE();
    res.statusCode = 200; res.statusMessage = "";
    res._headers = {}; res.finished = false; res.headersSent = false;
    res._chunks = [];
    res.setHeader = function (k, v) { res._headers[String(k).toLowerCase()] = v; return res; };
    res.set = res.header = function (k, v) { if (typeof k === "object") { Object.keys(k).forEach(function (kk) { res.setHeader(kk, k[kk]); }); } else res.setHeader(k, v); return res; };
    res.get = function (k) { return res._headers[String(k).toLowerCase()]; };
    res.getHeader = res.get;
    res.getHeaders = function () { return Object.assign({}, res._headers); };
    res.hasHeader = function (k) { return k.toLowerCase() in res._headers; };
    res.removeHeader = function (k) { delete res._headers[k.toLowerCase()]; };
    res.writeHead = function (code, headers) {
      if (code) res.statusCode = code;
      if (typeof headers === "string") res.statusMessage = headers;
      else if (headers) Object.keys(headers).forEach(function (k) { res.setHeader(k, headers[k]); });
      res.headersSent = true;
      return res;
    };
    res.status = function (c) { res.statusCode = c; return res; };
    res.type = function (t) { res.setHeader("Content-Type", t); return res; };
    res.location = function (p) { res.setHeader("Location", p); return res; };
    res.send = function (body) {
      if (body === undefined) return res.end();
      if (Buffer.isBuffer(body)) return res.end(body);
      if (typeof body === "object") return res.json(body);
      if (!res.get("Content-Type")) res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(String(body));
    };
    res.json = function (obj) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.end(JSON.stringify(obj));
    };
    res.redirect = function (loc, status) {
      if (typeof loc === "number") { status = loc; loc = arguments[1]; }
      res.status(status || 302).location(loc).end();
      return res;
    };
    res.end = function (data) {
      if (data !== undefined && data !== null) res._chunks.push(Buffer.isBuffer(data) ? data.toString("utf8") : String(data));
      if (!res.finished) { res.finished = true; queueMicrotask(() => res.emit("finish")); }
      return res;
    };
    res.write = function (c) { res._chunks.push(String(c)); return true; };
    res.flushHeaders = function () {};
    res.setTimeout = function () { return res; };
    return res;
  }
  shims.__makeRequest = makeRequest;
  shims.__makeResponse = makeResponse;

  shims.http = {
    createServer: function (handler) {
      var s = {
        __listener: handler,
        listen: function (port, cb) {
          s.port = port;
          s.address = function () { return { port: port }; };
          servers.push(s);
          shims.__active = { port: port, handle: function (req, res, next) { handler(req, res, next); } };
          if (typeof port === "function") { cb = port; port = 3000; }
          setTimeout(function () { if (cb) cb(); }, 0);
          return s;
        },
        close: function (cb) { if (cb) cb(); return s; },
        on: function () { return s; },
      };
      s.address = function () { return { port: s.port || 3000 }; };
      return s;
    },
    STATUS_CODES: STATUS_CODES,
    METHODS: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  };

  // __request — «супертест»: отправляет запрос к запущенному (мок-)серверу
  window.__request = async function (method, url, opts) {
    opts = opts || {};
    var target = shims.__active;
    if (!target) throw new Error("[sandbox] сервер не запущен: вызови app.listen(...) / http.createServer(...).listen(...)");
    var req = makeRequest(method, url, opts.body, opts.headers);
    var res = makeResponse();
    // body → data-события (для body-parser / ручного чтения)
    if (opts.body !== undefined && opts.body !== null) {
      var payload = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
      if (!req.get("content-type")) req.setHeader("content-type", typeof opts.body === "string" ? "text/plain" : "application/json");
      req.setHeader("content-length", String(Buffer.byteLength(payload)));
      queueMicrotask(function () { req.emit("data", payload); req.emit("end"); });
    } else {
      queueMicrotask(function () { req.emit("end"); });
    }
    var settled = false;
    var result = await new Promise(function (resolve, reject) {
      res.on("finish", function () { if (!settled) { settled = true; resolve(); } });
      req.on("error", function (e) { if (!settled) { settled = true; reject(e); } });
      setTimeout(function () { if (!settled) { settled = true; resolve(); } }, 2500);
      try {
        if (typeof target.handle === "function") target.handle(req, res, function (err) {
          if (err) { res.status(500).json({ error: err.message }); }
        });
        else reject(new Error("[sandbox] нет обработчика"));
      } catch (e) { if (!settled) { settled = true; reject(e); } }
    });
    var bodyText = res._chunks.join("");
    var parsed = bodyText;
    try { parsed = JSON.parse(bodyText); } catch (e) { /* не JSON */ }
    return { status: res.statusCode, headers: res.getHeaders(), body: parsed, raw: bodyText };
  };
  window.__db = null; // заглушка для моков БД

  // ---------- mini-Express (API-подмножество курса) ----------
  function compilePath(p) {
    var names = [];
    var re = p === "*" ? ".*" : p.replace(/:[^/]+/g, function (m) { names.push(m.slice(1)); return "([^/]+)"; }).replace(/\\*\\//g, "*/").replace(/\\*$/g, ".*");
    return { regex: new RegExp("^" + re + "$"), names: names };
  }
  function matchLayer(layer, urlPath) {
    if (!layer.method) {
      // use(): префиксная семантика
      if (layer.path === "/") return { ok: true, params: {} };
      if (urlPath === layer.path || urlPath.indexOf(layer.path + "/") === 0) return { ok: true, params: {} };
      return { ok: false };
    }
    if (layer.path === "/") return urlPath === "/" ? { ok: true, params: {} } : { ok: false };
    var c = compilePath(layer.path);
    var m = urlPath.match(c.regex);
    if (!m) return { ok: false };
    var params = {};
    c.names.forEach(function (n, i) { params[n] = decodeURIComponent(m[i + 1]); });
    return { ok: true, params: params };
  }
  function runStack(stack, req, res, outerNext, basePath) {
    if (outerNext === null) outerNext = undefined;
    basePath = basePath || "";
    var idx = 0;
    function effPath() { return basePath ? (req.path.slice(basePath.length) || "/") : req.path; }
    function next(err) {
      if (err) {
        for (; idx < stack.length; idx++) {
          var l = stack[idx];
          if (!matchLayer(l, effPath()).ok) continue;
          for (var fi = 0; fi < l.fns.length; fi++) {
            if (l.fns[fi].length === 4) {
              idx++;
              try { l.fns[fi](err, req, res, next); } catch (e) { next(e); }
              return;
            }
          }
        }
        if (outerNext) outerNext(err);
        else { if (!res.finished) { console.error("[Express:sandbox] " + (err && err.stack || err)); res.status(500).json({ error: (err && err.message) || "Internal Server Error" }); } }
        return;
      }
      for (; idx < stack.length; idx++) {
        var layer = stack[idx];
        var m = matchLayer(layer, effPath());
        if (!m.ok) continue;
        if (layer.method && layer.method !== req.method) continue;
        idx++;
        var fns = layer.fns; var fi = 0;
        (function runFn() {
          if (fi >= fns.length) { next(); return; }
          var fn = fns[fi++];
          Object.keys(m.params).forEach(function (k) { req.params[k] = m.params[k]; });
          try {
            var ret = fn(req, res, next);
            if (ret && typeof ret.then === "function") ret.catch(function (e) { next(e); });
          } catch (e) { next(e); }
        })();
        return;
      }
      if (outerNext) outerNext();
      else if (!res.finished && !res.headersSent) res.status(404).send("Cannot " + req.method + " " + req.path);
    }
    next(undefined);
  }
  function makeApp() {
    var stack = [];
    var app = function (req, res, done) {
      req.app = req.app || app;
      runStack(stack, req, res, null, "");
    };
    app.__stack = stack;
    app.handle = app;
    app.use = function () {
      var args = Array.prototype.slice.call(arguments);
      var path = "/";
      if (typeof args[0] === "string") path = args.shift();
      stack.push({ method: null, path: path, fns: args });
      return app;
    };
    ["get", "post", "put", "delete", "patch", "head", "options"].forEach(function (m) {
      app[m] = function (path) {
        var fns = Array.prototype.slice.call(arguments, 1);
        stack.push({ method: m.toUpperCase(), path: path, fns: fns });
        return app;
      };
    });
    app.all = function (path) {
      var fns = Array.prototype.slice.call(arguments, 1);
      stack.push({ method: null, path: path, fns: fns });
      return app;
    };
    app.listen = function (port, cb) {
      var server = shims.http.createServer(function (req, res) { app(req, res, function () {}); });
      return server.listen(port, cb);
    };
    app.set = function () { return app; };
    app.get_view = function () { return undefined; };
    return app;
  }
  var express = function () { return makeApp(); };
  express.Router = function () {
    var r = makeApp();
    // mounted-роутер: при вызове как middleware — запускает свой стек с basePath = mount-точка
    var origCall = r;
    function router(req, res, next) {
      var mount = req.__currentMount || "";
      runStack(r.__stack, req, res, next, mount);
    }
    // перехват: when this router is used inside app.use(path, router), set mount
    var wrapped = function (req, res, next) {
      // mount-point определяется внешним слоем: мы его передаём через req
      runStack(r.__stack, req, res, next, req.__mountPath || "");
    };
    // заменяем callable, но сохраняем app-методы
    Object.assign(wrapped, r);
    wrapped.__stack = r.__stack;
    return wrapped;
  };
  // чтобы app.use(path, router) знал mount: храним в req при вызове fn-слоя
  var _origRunStack = runStack;
  // (обёртка на уровне runStack: перед вызовом fn запоминаем req.__mountPath = layer.path)
  // реализация: правим runStack через закрывающую функцию ниже — проще: patch в matchPath-цикле
  // → делаем через monkey-patch express-слоёв: при push в use() обёртываем fn-роутеры
  var _usePatch = function (app) {
    var origUse = app.use;
    app.use = function () {
      var args = Array.prototype.slice.call(arguments);
      var path = "/";
      if (typeof args[0] === "string") path = args.shift();
      var fns = args.map(function (fn) {
        if (fn && fn.__stack) {
          return function (req, res, next) {
            var prev = req.__mountPath;
            req.__mountPath = path === "/" ? "" : path;
            fn(req, res, next);
            req.__mountPath = prev;
          };
        }
        return fn;
      });
      app.__stack.push({ method: null, path: path, fns: fns });
      return app;
    };
  };
  var _realMakeApp = makeApp;
  makeApp = function () { var a = _realMakeApp(); _usePatch(a); return a; };
  express.Router = function () {
    var r = makeApp();
    function wrapped(req, res, next) { runStack(r.__stack, req, res, next, req.__mountPath || ""); }
    Object.assign(wrapped, r);
    wrapped.__stack = r.__stack;
    return wrapped;
  };
  express.json = function () {
    return function (req, res, next) {
      var ct = String(req.get("content-type") || "");
      if (ct.includes("application/json")) {
        var chunks = [];
        req.on("data", function (c) { chunks.push(c); });
        req.once("end", function () {
          var text = Buffer.concat(chunks).toString("utf8");
          if (!text) return next();
          try { req.body = JSON.parse(text); next(); }
          catch (e) { next(Object.assign(new Error("Unexpected end of JSON input or invalid JSON"), { status: 400, type: "entity.parse.failed" })); }
        });
        return;
      }
      req.body = req.body || {};
      next();
    };
  };
  express.urlencoded = function () {
    return function (req, res, next) {
      var ct = String(req.get("content-type") || "");
      if (ct.includes("application/x-www-form-urlencoded")) {
        var chunks = [];
        req.on("data", function (c) { chunks.push(c); });
        req.once("end", function () {
          var sp = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
          req.body = {};
          sp.forEach(function (v, k) { req.body[k] = v; });
          next();
        });
        return;
      }
      req.body = req.body || {};
      next();
    };
  };
  express.static = function (dir) {
    return function (req, res, next) {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      var p = shims.path.join(dir, req.path === "/" ? "index.html" : req.path);
      try {
        var data = shims.fs.readFileSync(p);
        res.setHeader("Content-Type", p.endsWith(".html") ? "text/html" : p.endsWith(".js") ? "text/javascript" : "text/plain");
        res.send(data);
      } catch (e) { next(); }
    };
  };
  shims.express = express;

  // ---------- pg mock (мини-SQL: CREATE/INSERT/SELECT/UPDATE/DELETE) ----------
  function makeDb() {
    var tables = Object.create(null);
    function table(name) { if (!tables[name]) tables[name] = { rows: [], auto: 1 }; return tables[name]; }
    function sub(sql, values) {
      values = values || [];
      return sql.replace(/\\$(\\d+)/g, function (m, n) { return JSON.stringify(values[Number(n) - 1]); });
    }
    function cmp(op, a, b) {
      if (op === "=") return a === b || String(a) === String(b);
      if (op === "!=" || op === "<>") return a !== b && String(a) !== String(b);
      if (op === ">") return a > b;
      if (op === ">=") return a >= b;
      if (op === "<") return a < b;
      if (op === "<=") return a <= b;
      return true;
    }
    function where(rows, cond) {
      if (!cond) return rows;
      return rows.filter(function (r) {
        return cond.split(/\\s+AND\\s+/i).every(function (c) {
          var m = c.trim().match(/^(\\w+)\\s*(=|!=|<>|>=|<=|>|<)\\s*(.+)$/);
          if (!m) return true;
          return cmp(m[2], r[m[1]], JSON.parse(m[3]));
        });
      });
    }
    function q(text, values) {
      var sql = sub(String(text).replace(/\\s+/g, " ").trim().replace(/;$/, ""), values);
      console.debug("[pg:sandbox]", sql);
      var m;
      if ((m = sql.match(/^CREATE TABLE (IF NOT EXISTS )?(\\w+)[\\s(]/i))) { table(m[2].toLowerCase()); return { rows: [], rowCount: 0 }; }
      if ((m = sql.match(/^INSERT INTO (\\w+) \\(([^)]+)\\) VALUES \\(([^)]+)\\)( RETURNING \\*)?$/i))) {
        var t = table(m[1].toLowerCase());
        var cols = m[2].split(",").map(function (x) { return x.trim(); });
        var vals = JSON.parse("[" + m[3] + "]");
        var row = { id: t.auto++ };
        cols.forEach(function (c, i) { row[c] = vals[i]; });
        t.rows.push(row);
        return { rows: m[4] ? [Object.assign({}, row)] : [], rowCount: 1 };
      }
      if ((m = sql.match(/^SELECT COUNT\\(\\*\\) AS (\\w+) FROM (\\w+)( WHERE .+)?$/i))) {
        return { rows: [{ [m[1]]: where(table(m[2].toLowerCase()).rows, m[4] ? m[4].slice(6).trim() : null).length }], rowCount: 1 };
      }
      if ((m = sql.match(/^SELECT \\* FROM (\\w+)( WHERE (.+))?( ORDER BY (\\w+)( DESC)?)?( LIMIT (\\d+))?$/i))) {
        var rows = where(table(m[1].toLowerCase()).rows, m[3]);
        if (m[5]) rows.sort(function (a, b) { var x = a[m[5]], y = b[m[5]]; return (x < y ? -1 : x > y ? 1 : 0) * (m[6] ? -1 : 1); });
        if (m[8]) rows = rows.slice(0, parseInt(m[8], 10));
        return { rows: rows.map(function (r) { return Object.assign({}, r); }), rowCount: rows.length };
      }
      if ((m = sql.match(/^UPDATE (\\w+) SET (.+) WHERE (.+)$/i))) {
        var t2 = table(m[1].toLowerCase());
        var n = 0;
        t2.rows.forEach(function (r) {
          if (!where([r], m[3]).length) return;
          m[2].split(",").forEach(function (p) {
            var pm = p.trim().match(/^(\\w+)\\s*=\\s*(.+)$/);
            if (pm) { r[pm[1]] = JSON.parse(pm[2]); n++; }
          });
        });
        return { rows: [], rowCount: Math.floor(n / Math.max(1, m[2].split(",").length)) };
      }
      if ((m = sql.match(/^DELETE FROM (\\w+) WHERE (.+)$/i))) {
        var t3 = table(m[1].toLowerCase());
        var keep = where(t3.rows, m[2]);
        var deleted = t3.rows.length - keep.length;
        t3.rows = keep;
        return { rows: [], rowCount: deleted };
      }
      throw new Error("[pg:sandbox] не распознан запрос (поддерживаются: CREATE TABLE / INSERT ... VALUES [RETURNING *] / SELECT * | COUNT(*) ... FROM [WHERE col OP $n ...] [ORDER BY] [LIMIT] / UPDATE ... SET ... WHERE / DELETE ... WHERE): " + text);
    }
    return {
      query: function (text, values) { return new Promise(function (res) { setTimeout(function () { res(q(text, values)); }, 1); }); },
      end: function () { return Promise.resolve(); },
    };
  }
  var pgPool = makeDb();
  shims.pg = { Pool: function () { return pgPool; }, Client: function () { return pgPool; }, pool: pgPool };
  window.__db = { pg: pgPool };

  // ---------- mongodb mock ----------
  function oid() {
    var h = "0123456789abcdef"; var s = "";
    for (var i = 0; i < 24; i++) s += h[Math.floor(Math.random() * 16)];
    return s;
  }
  function matches(doc, filter) {
    if (!filter || !Object.keys(filter).length) return true;
    return Object.keys(filter).every(function (k) {
      var cond = filter[k];
      if (cond && typeof cond === "object" && !Array.isArray(cond) && !Buffer.isBuffer(cond)) {
        return Object.keys(cond).every(function (op) {
          var v = doc[k];
          if (op === "$gt") return v > cond[op];
          if (op === "$gte") return v >= cond[op];
          if (op === "$lt") return v < cond[op];
          if (op === "$lte") return v <= cond[op];
          if (op === "$ne") return v !== cond[op];
          if (op === "$in") return cond[op].includes(v);
          if (op === "$regex") return new RegExp(cond[op], cond[op2] || "").test(String(v));
          return true;
        });
      }
      return doc[k] === cond;
    });
  }
  var mongoCollections = Object.create(null);
  function coll(name) {
    var rows = (mongoCollections[name] = mongoCollections[name] || []);
    return {
      insertOne: function (doc) { var d = Object.assign({ _id: oid() }, doc); rows.push(d); return Promise.resolve({ insertedId: d._id }); },
      insertMany: function (docs) { docs.forEach(function (d) { rows.push(Object.assign({ _id: oid() }, d)); }); return Promise.resolve({ insertedCount: docs.length }); },
      find: function (filter) {
        var result = rows.filter(function (d) { return matches(d, filter); });
        return {
          toArray: function () { return Promise.resolve(result); },
          limit: function (n) { result = result.slice(0, n); return this; },
          sort: function (obj) { var k = Object.keys(obj)[0]; result.sort(function (a, b) { return (a[k] < b[k] ? -1 : 1) * obj[k]; }); return this; },
          skip: function (n) { result = result.slice(n); return this; },
        };
      },
      findOne: function (filter) { return Promise.resolve(rows.find(function (d) { return matches(d, filter); }) || null); },
      updateOne: function (filter, update) {
        var doc = rows.find(function (d) { return matches(d, filter); });
        var n = 0;
        if (doc && update) {
          if (update.$set) Object.assign(doc, update.$set);
          if (update.$inc) Object.keys(update.$inc).forEach(function (k) { doc[k] = (doc[k] || 0) + update.$inc[k]; });
          n = 1;
        }
        return Promise.resolve({ matchedCount: doc ? 1 : 0, modifiedCount: n });
      },
      deleteOne: function (filter) {
        var i = rows.findIndex(function (d) { return matches(d, filter); });
        if (i >= 0) rows.splice(i, 1);
        return Promise.resolve({ deletedCount: i >= 0 ? 1 : 0 });
      },
      deleteMany: function (filter) { var b = rows.length; rows = rows.filter(function (d) { return !matches(d, filter); }); return Promise.resolve({ deletedCount: b - rows.length }); },
      countDocuments: function (filter) { return Promise.resolve(rows.filter(function (d) { return matches(d, filter); }).length); },
    };
  }
  shims.mongodb = {
    MongoClient: {
      connect: function (url) {
        console.debug("[mongo:sandbox] connect " + url);
        return new Promise(function (res) {
          setTimeout(function () {
            res({
              db: function (name) { return { collection: function (n) { return coll(n); } }; },
              close: function () { return Promise.resolve(); },
            });
          }, 1);
        });
      },
    },
    ObjectId: function (s) { return s || oid(); },
  };
  window.__db = window.__db || {};
  window.__db.mongo = mongoCollections;

  // ---------- jsonwebtoken (HS256, чистый JS) ----------
  var SHA_K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function sha256Bytes(data) {
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var len = data.length;
    var withOne = new Uint8Array(((len + 8) >> 6 << 6) + 64);
    withOne.set(data); withOne[len] = 0x80;
    var dv = new DataView(withOne.buffer);
    dv.setUint32(withOne.length - 4, len << 3);
    var w = new Array(64);
    function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
    for (var off = 0; off < withOne.length; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (var j = 16; j < 64; j++) {
        var s0 = rotl(w[j-15], 7) ^ rotl(w[j-15], 18) ^ (w[j-15] >>> 3);
        var s1 = rotl(w[j-2], 17) ^ rotl(w[j-2], 19) ^ (w[j-2] >>> 10);
        w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var t = 0; t < 64; t++) {
        var S1 = rotl(e, 6) ^ rotl(e, 11) ^ rotl(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + SHA_K[t] + w[t]) | 0;
        var S0 = rotl(a, 2) ^ rotl(a, 13) ^ rotl(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    var out = new Uint8Array(32);
    var odv = new DataView(out.buffer);
    H.forEach(function (x, i) { odv.setUint32(i * 4, x >>> 0); });
    return out;
  }
  function b64u(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i+1] || 0) << 8) | (bytes[i+2] || 0);
      s += String.fromCharCode(0x40 + ((n >> 18) & 63)) + String.fromCharCode(0x40 + ((n >> 12) & 63)) + (bytes[i+1] !== undefined ? String.fromCharCode(0x40 + ((n >> 6) & 63)) : "") + (bytes[i+2] !== undefined ? String.fromCharCode(0x40 + (n & 63)) : "");
    }
    // base64url: A-Z a-z 0-9 - _
    return s.replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
  }
  // правильный base64url через btoa
  function b64uStr(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, ""); }
  function b64uDec(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }
  function hmacSha256(key, msg) {
    var k = new Uint8Array(key.length > 64 ? sha256Bytes(key) : key.length);
    if (key.length > 64) { var kk = sha256Bytes(key); k = kk; }
    var ipad = new Uint8Array(64 + msg.length), opad = new Uint8Array(64 + 32);
    for (var i = 0; i < 64; i++) { ipad[i] = 0x36 ^ (k[i] || 0); opad[i] = 0x5c ^ (k[i] || 0); }
    for (var j = 0; j < msg.length; j++) ipad[64 + j] = msg[j];
    for (var m = 0; m < 32; m++) opad[64 + m] = (sha256Bytes(ipad))[m];
    var inner = sha256Bytes(ipad);
    for (var n = 0; n < 32; n++) opad[64 + n] = inner[n];
    return sha256Bytes(opad);
  }
  function parseExpire(s) {
    if (typeof s === "number") return s;
    var m = String(s).match(/^(\\d+)([smhd])$/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return n * { s: 1, m: 60, h: 3600, d: 86400 }[m[2]];
  }
  shims.jsonwebtoken = {
    sign: function (payload, secret, opts) {
      opts = opts || {};
      var header = { alg: "HS256", typ: "JWT" };
      var p = Object.assign({}, payload);
      var now = Math.floor(Date.now() / 1000);
      p.iat = p.iat || now;
      if (opts.expiresIn) p.exp = now + parseExpire(opts.expiresIn);
      var h = b64uStr(JSON.stringify(header));
      var b = b64uStr(JSON.stringify(p));
      var sig = b64uStr(String.fromCharCode.apply(null, hmacSha256(new TextEncoder().encode(secret), new TextEncoder().encode(h + "." + b))));
      return h + "." + b + "." + sig;
    },
    verify: function (token, secret) {
      var parts = String(token).split(".");
      if (parts.length !== 3) throw new Error("jwt malformed");
      var expected = b64uStr(String.fromCharCode.apply(null, hmacSha256(new TextEncoder().encode(secret), new TextEncoder().encode(parts[0] + "." + parts[1]))));
      if (expected !== parts[2]) throw new Error("invalid signature");
      var payload = JSON.parse(b64uDec(parts[1]));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("jwt expired");
      return payload;
    },
    decode: function (token) {
      try { return JSON.parse(b64uDec(String(token).split(".")[1])); } catch (e) { return null; }
    },
  };

  // ---------- helmet / cors / dotenv / util ----------
  shims.helmet = function () {
    return function (req, res, next) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
      next();
    };
  };
  shims.cors = function (opts) {
    opts = opts || {};
    return function (req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", opts.origin || "*");
      res.setHeader("Access-Control-Allow-Methods", (opts.methods || "GET,POST,PUT,DELETE,PATCH,OPTIONS").join ? (opts.methods || "GET,POST,PUT,DELETE,PATCH,OPTIONS") : "GET,POST,PUT,DELETE");
      res.setHeader("Access-Control-Allow-Headers", opts.allowedHeaders || "Content-Type,Authorization");
      if (req.method === "OPTIONS") { res.status(204).end(); return; }
      next();
    };
  };
  shims.dotenv = { config: function () { return { parsed: Object.assign({}, process.env) }; } };
  shims.util = {
    format: function (args) {
      var a = Array.prototype.slice.call(arguments);
      var s = String(a.shift());
      return s.replace(/%[sdj%]/g, function (m) { if (!a.length) return m; var v = a.shift(); if (m === "%j") { try { return JSON.stringify(v); } catch (e) { return String(v); } } return String(v); });
    },
    promisify: function (fn) {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function (res, rej) {
          args.push(function (err, val) { err ? rej(err) : res(val); });
          fn.apply(null, args);
        });
      };
    },
    types: { isPromise: function (v) { return !!(v && typeof v.then === "function"); } },
    inspect: function (v) { try { return JSON.stringify(v); } catch (e) { return String(v); } },
    deprecate: function (fn) { return fn; },
  };

  // ---------- Buffer-глобал (если нет нативного) ----------
  if (!globalThis.Buffer) {
    // загрузим из esm.sh при первом обращении — но проще: мини-Buffer через TextEncoder
    var TE = new TextEncoder(), TD = new TextDecoder();
    function MiniBuffer(data, enc) {
      if (data instanceof Uint8Array) this.buf = data;
      else if (typeof data === "string") this.buf = TE.encode(data);
      else this.buf = new Uint8Array(data || 0);
    }
    MiniBuffer.prototype.toString = function (enc) { return enc === "base64" ? btoa(String.fromCharCode.apply(null, this.buf)) : enc === "hex" ? Array.from(this.buf).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("") : TD.decode(this.buf); };
    MiniBuffer.byteLength = function (s) { return typeof s === "string" ? TE.encode(s).length : s.length; };
    MiniBuffer.from = function (d, e) { return new MiniBuffer(d, e); };
    MiniBuffer.concat = function (arr) { var enc = new TextEncoder(); var norm = arr.map(function (b) { var bb = b.buf || b; return typeof bb === "string" ? enc.encode(bb) : bb; }); var total = norm.reduce(function (s, b) { return s + b.length; }, 0); var out = new Uint8Array(total), i = 0; norm.forEach(function (b) { out.set(b, i); i += b.length; }); return new MiniBuffer(out); };
    MiniBuffer.isBuffer = function (v) { return v instanceof MiniBuffer || v instanceof Uint8Array; };
    globalThis.Buffer = MiniBuffer;
  }
})();

  // ---------- bcrypt (mock: дjb2-хеш с солью; API как bcryptjs) ----------
  function djb2(s) { var h = 5381; for (var i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; } return h.toString(36); }
  function bcryptMake(password, saltOrRounds) {
    var salt;
    if (typeof saltOrRounds === "string") salt = saltOrRounds;
    else salt = "s" + Math.random().toString(36).slice(2, 10) + "$" + (Number(saltOrRounds) || 10);
    return "$2b$" + salt + "$" + djb2(String(password) + "::" + salt);
  }
  var bcrypt = {
    genSalt: function (rounds) { return Promise.resolve("s" + Math.random().toString(36).slice(2, 10) + "$" + (rounds || 10)); },
    hash: function (password, saltOrRounds) { return Promise.resolve(bcryptMake(password, saltOrRounds)); },
    hashSync: function (password, saltOrRounds) { return bcryptMake(password, saltOrRounds); },
    compare: function (password, hash) {
      var parts = String(hash).split("$");
      var salt = parts[2], digest = parts[3];
      return Promise.resolve(!!(salt && digest && djb2(String(password) + "::" + salt) === digest));
    },
    compareSync: function (password, hash) {
      var parts = String(hash).split("$");
      var salt = parts[2], digest = parts[3];
      return !!(salt && digest && djb2(String(password) + "::" + salt) === digest);
    }
  };
  globalThis.__shims.bcrypt = bcrypt;
  globalThis.__shims.bcryptjs = bcrypt;
`;
