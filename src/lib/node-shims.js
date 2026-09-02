// Node.js sandbox-шимы для раннера (browser-версия встроенных модулей + mini-Express + моки pg/mongodb/mongoose).
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

  // ---------- mongodb mock (extended: filter-операторы, aggregate, indexes, mongoose) ----------
  function oid() {
    var h = "0123456789abcdef"; var s = "";
    for (var i = 0; i < 24; i++) s += h[Math.floor(Math.random() * 16)];
    return s;
  }
  function oidStr(v) {
    if (v == null) return null;
    if (typeof v === "string") return v;
    if (typeof v.toString === "function") return String(v);
    return null;
  }
  function oidEq(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return oidStr(a) === oidStr(b);
  }
  function getVal(doc, path) {
    var parts = String(path).split(".");
    var cur = doc;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      if (Array.isArray(cur)) return cur.map(function (it) { return i + 1 < parts.length ? getVal(it, parts.slice(i + 1).join(".")) : it; });
      cur = cur[parts[i]];
    }
    return cur;
  }
  function setVal(doc, path, val) {
    var parts = String(path).split(".");
    var cur = doc;
    for (var i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    if (val === undefined || val === null) delete cur[parts[parts.length - 1]];
    else cur[parts[parts.length - 1]] = val;
  }
  function containsArr(arr, v) {
    if (!Array.isArray(arr)) return false;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === v) return true;
      if (oidEq(arr[i], v)) return true;
      if (arr[i] != null && typeof arr[i] === "object" && v != null && typeof v === "object") {
        var ks = Object.keys(v); var ok = true;
        for (var j = 0; j < ks.length; j++) if (!oidEq(arr[i][ks[j]], v[ks[j]])) { ok = false; break; }
        if (ok) return true;
      }
    }
    return false;
  }
  function matchCond(v, cond) {
    var ops = Object.keys(cond);
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i], cv = cond[op];
      switch (op) {
        case "$eq": if (!oidEq(v, cv)) return false; break;
        case "$ne": if (oidEq(v, cv)) return false; break;
        case "$gt": if (!(v > cv)) return false; break;
        case "$gte": if (!(v >= cv)) return false; break;
        case "$lt": if (!(v < cv)) return false; break;
        case "$lte": if (!(v <= cv)) return false; break;
        case "$in": if (!containsArr(cv, v)) return false; break;
        case "$nin": if (containsArr(cv, v)) return false; break;
        case "$exists": if (Boolean(v !== undefined) !== Boolean(cv)) return false; break;
        case "$regex": if (!new RegExp(cv, cond["$options"] || "").test(String(v))) return false; break;
        case "$options": break;
        case "$size": if (!Array.isArray(v) || v.length !== cv) return false; break;
        case "$all": for (var a2 = 0; a2 < cv.length; a2++) if (!containsArr(v, cv[a2])) return false; break;
        case "$elemMatch":
          if (!Array.isArray(v)) return false;
          var any = false;
          for (var e = 0; e < v.length; e++) if (matches(v[e], cv) || (!cv.$gt && v[e] > (cv.$gte || cv.$gt || -Infinity) && v[e] < (cv.$lt !== undefined ? cv.$lt : (cv.$lte !== undefined ? cv.$lte + 1 : Infinity)))) any = true;
          if (!any) return false; break;
        case "$not": if (matchCond(v, cv)) return false; break;
        default: break;
      }
    }
    return true;
  }
  function matches(doc, filter) {
    if (!filter || !Object.keys(filter).length) return true;
    var top = false;
    for (var tk in filter) {
      if (tk === "$and" || tk === "$or" || tk === "$nor" || tk === "$text") {
        if (tk === "$and") { for (var i2 = 0; i2 < filter[tk].length; i2++) if (!matches(doc, filter[tk][i2])) return false; continue; }
        if (tk === "$text") continue;
        var m2 = false;
        for (var i3 = 0; i3 < filter[tk].length; i3++) if (matches(doc, filter[tk][i3])) { m2 = true; break; }
        if (tk === "$nor" && m2) return false;
        if (tk === "$or" && !m2) return false;
        continue;
      }
      var cond = filter[tk];
      if (cond && typeof cond === "object" && !Array.isArray(cond) && !Buffer.isBuffer(cond) && !(cond instanceof RegExp) && !(cond instanceof ObjectIdClass)) {
        if (Object.keys(cond).length && Object.keys(cond).every(function (k) { return k.charAt(0) === "$"; })) {
          if (tk === "_id" && cond.$oid !== undefined && cond.$eq === undefined) cond = cond.$oid;
          else if (!matchCond(getVal(doc, tk), cond)) return false;
          continue;
        }
      }
      var dv = getVal(doc, tk);
      if (cond instanceof RegExp) { if (!cond.test(String(dv))) return false; continue; }
      if (cond != null && typeof cond === "object" && cond._bsontype === "ObjectId") { if (!oidEq(dv, cond)) return false; continue; }
      if (Array.isArray(cond) && !Object.keys(cond).every(function (k) { return k.charAt(0) === "$"; })) { if (dv !== cond && !oidEq(dv, cond) && !containsArr(dv, cond)) return false; continue; }
      if (!oidEq(dv, cond) && !(Array.isArray(dv) && containsArr(dv, cond))) return false;
    }
    return true;
  }
  function applyUpdate(doc, update) {
    var ops = Object.keys(update).filter(function (k) { return k.charAt(0) === "$"; });
    if (!ops.length) {
      if (update._id !== undefined && doc._id !== undefined && !oidEq(update._id, doc._id)) throw new Error("Смена _id недопустима");
      var keepId = doc._id;
      for (var k in doc) delete doc[k];
      Object.assign(doc, update);
      doc._id = keepId;
      return;
    }
    if (update.$set) Object.keys(update.$set).forEach(function (k) { setVal(doc, k, update.$set[k]); });
    if (update.$unset) Object.keys(update.$unset).forEach(function (k) { setVal(doc, k, undefined); });
    if (update.$inc) Object.keys(update.$inc).forEach(function (k) { setVal(doc, k, (getVal(doc, k) || 0) + update.$inc[k]); });
    if (update.$mul) Object.keys(update.$mul).forEach(function (k) { setVal(doc, k, (getVal(doc, k) || 0) * update.$mul[k]); });
    if (update.$min) Object.keys(update.$min).forEach(function (k) { var v = getVal(doc, k); if (v === undefined || update.$min[k] < v) setVal(doc, k, update.$min[k]); });
    if (update.$max) Object.keys(update.$max).forEach(function (k) { var v = getVal(doc, k); if (v === undefined || update.$max[k] > v) setVal(doc, k, update.$max[k]); });
    if (update.$push) Object.keys(update.$push).forEach(function (k) { var v = getVal(doc, k); if (!Array.isArray(v)) v = []; if (update.$push[k] && update.$push[k].$each) v = v.concat(update.$push[k].$each); else v.push(update.$push[k]); setVal(doc, k, v); });
    if (update.$addToSet) Object.keys(update.$addToSet).forEach(function (k) { var v = getVal(doc, k); if (!Array.isArray(v)) v = []; var item = update.$addToSet[k]; if (!containsArr(v, item)) v.push(item); setVal(doc, k, v); });
    if (update.$pull) Object.keys(update.$pull).forEach(function (k) {
      var v = getVal(doc, k);
      if (!Array.isArray(v)) return;
      var crit = update.$pull[k];
      var isDocMatch = crit && typeof crit === "object" && !Array.isArray(crit);
      setVal(doc, k, v.filter(function (x) {
        if (isDocMatch && x && typeof x === "object" && !Array.isArray(x)) return !matches(x, crit);
        return !oidEq(x, crit) && x !== crit;
      }));
    });
    if (update.$pop) Object.keys(update.$pop).forEach(function (k) { var v = getVal(doc, k); if (Array.isArray(v)) { if (update.$pop[k] === 1) v.pop(); else v.shift(); setVal(doc, k, v); } });
    if (update.$currentDate) Object.keys(update.$currentDate).forEach(function (k) { setVal(doc, k, new Date()); });
  }
  // --- expressions для aggregate: "$field", {$op: …}, вложенные ---
  function resolveExpr(doc, expr) {
    if (expr && typeof expr === "object" && !Array.isArray(expr)) {
      var keys = Object.keys(expr);
      if (keys.length === 1 && keys[0].charAt(0) === "$") {
        var op = keys[0], arg = expr[keys[0]];
        if (op === "$literal") return arg;
        var args = Array.isArray(arg) ? arg.map(function (a) { return resolveExpr(doc, a); }) : [resolveExpr(doc, arg)];
        switch (op) {
          case "$add": return args.reduce(function (s, x) { return s + (x || 0); }, 0);
          case "$subtract": return args[0] - (args[1] || 0);
          case "$multiply": return args.reduce(function (s, x) { return s * (x || 0); }, 0);
          case "$divide": return (args[0] || 0) / (args[1] || 1);
          case "$concat": return args.map(function (x) { return x == null ? "" : String(x); }).join("");
          case "$toUpper": return String(args[0] == null ? "" : args[0]).toUpperCase();
          case "$toLower": return String(args[0] == null ? "" : args[0]).toLowerCase();
          case "$toString": return args[0] == null ? null : String(args[0]);
          case "$toInt": return args[0] == null ? null : parseInt(args[0], 10);
          case "$size": return Array.isArray(args[0]) ? args[0].length : null;
          case "$year": return args[0] ? new Date(args[0]).getFullYear() : null;
          case "$month": return args[0] ? new Date(args[0]).getMonth() + 1 : null;
          case "$dayOfMonth": return args[0] ? new Date(args[0]).getDate() : null;
          case "$abs": return Math.abs(args[0] || 0);
          case "$sum":
            if (args.length === 1) {
              var a0 = args[0];
              if (Array.isArray(a0)) return a0.reduce(function (s2, it) { return s2 + (typeof it === "number" ? it : (it && typeof it === "object" && typeof it.sum !== "undefined" ? (typeof it.sum === "number" ? it.sum : 0) : (typeof it === "number" ? it : 0))); }, 0);
              return typeof a0 === "number" ? a0 : (a0 && typeof a0 === "object" && typeof a0.sum === "number" ? a0.sum : 0);
            }
            return args.reduce(function (s2, x) { return s2 + (typeof x === "number" ? x : 0); }, 0);
          case "$avg":
            var av = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
            var nv = av.filter(function (x) { return typeof x === "number"; });
            return nv.length ? nv.reduce(function (s2, x) { return s2 + x; }, 0) / nv.length : null;
          case "$cond": return (args[0] ? args[1] : (args[2] !== undefined ? args[2] : null));
          case "$ifNull": for (var i = 0; i < args.length; i++) if (args[i] != null) return args[i]; return null;
          case "$eq": return oidEq(args[0], args[1]);
          case "$ne": return !oidEq(args[0], args[1]);
          case "$gt": return (args[0] || 0) > (args[1] || 0);
          case "$lt": return (args[0] || 0) < (args[1] || 0);
          default: return null;
        }
      }
      var outObj = {};
      for (var k in expr) {
        var v = resolveExpr(doc, expr[k]);
        if (v !== undefined) outObj[k] = v;
      }
      return outObj;
    }
    if (typeof expr === "string" && expr.charAt(0) === "$") return getVal(doc, expr.slice(1));
    return expr;
  }
  function accPush(arr, val) { arr.push(val); }
  function aggregateStage(docs, stage) {
    var key = Object.keys(stage)[0], spec = stage[key];
    var out = [];
    if (key === "$match") { out = docs.filter(function (d) { return matches(d, spec); }); return out; }
    if (key === "$project") {
      var excl = Object.values(spec).some(function (v) { return v === 0 || v === false; });
      out = docs.map(function (d) {
        if (excl) { var o = Object.assign({}, d); Object.keys(spec).forEach(function (k) { if (spec[k] === 0 || spec[k] === false) setVal(o, k, undefined); }); return o; }
        var o2 = {};
        Object.keys(spec).forEach(function (k) {
          if (spec[k] === 1 || spec[k] === true) { var v = getVal(d, k); if (v !== undefined) setVal(o2, k, v); }
          else { var v2 = resolveExpr(d, spec[k]); if (v2 !== undefined) setVal(o2, k, v2); }
        });
        if (spec._id !== 0 && spec._id !== false && d._id !== undefined) o2._id = d._id;
        return o2;
      });
      return out;
    }
    if (key === "$group") {
      var groups = Object.create(null);
      docs.forEach(function (d) {
        var gid;
        if (spec._id === null || spec._id === undefined) gid = "null";
        else if (typeof spec._id === "string" && spec._id.charAt(0) === "$") gid = oidStr(getVal(d, spec._id.slice(1))) || JSON.stringify(getVal(d, spec._id.slice(1)));
        else gid = JSON.stringify(resolveExpr(d, spec._id));
        if (!groups[gid]) groups[gid] = { _idVal: resolveExpr(d, spec._id), items: [] };
        groups[gid].items.push(d);
      });
      Object.keys(groups).forEach(function (gid) {
        var g = groups[gid], row = { _id: g._idVal === undefined ? null : g._idVal };
        Object.keys(spec).forEach(function (f) {
          if (f === "_id") return;
          var acc = spec[f], items = g.items;
          if (acc && typeof acc === "object" && acc.$push !== undefined) { row[f] = items.map(function (d) { return resolveExpr(d, acc.$push); }); return; }
          if (acc && typeof acc === "object" && acc.$addToSet !== undefined) { row[f] = []; items.forEach(function (d) { var v = resolveExpr(d, acc.$addToSet); if (!containsArr(row[f], v)) row[f].push(v); }); return; }
          if (acc && typeof acc === "object" && acc.$sum !== undefined) {
            if (acc.$sum === 1) { row[f] = items.length; return; }
            row[f] = items.reduce(function (sum, d) {
              var v = resolveExpr(d, acc.$sum);
              if (typeof v === "number") return sum + v;
              if (Array.isArray(v)) return sum + v.reduce(function (s2, it) { return s2 + (typeof it === "number" ? it : (it && typeof it === "object" ? (typeof it.sum === "number" ? it.sum : 0) : 0)); }, 0);
              if (v && typeof v === "object" && typeof v.sum === "number") return sum + v.sum;
              return sum;
            }, 0); return;
          }
          if (acc && typeof acc === "object" && acc.$avg !== undefined) {
            var vals = items.map(function (d) { return resolveExpr(d, acc.$avg); }).filter(function (v) { return typeof v === "number"; });
            row[f] = vals.length ? vals.reduce(function (s, v) { return s + v; }, 0) / vals.length : null; return;
          }
          if (acc && typeof acc === "object" && acc.$min !== undefined) {
            var mv = items.map(function (d) { return resolveExpr(d, acc.$min); }).filter(function (v) { return v != null; });
            row[f] = mv.length ? mv.reduce(function (a, b) { return a < b ? a : b; }) : null; return;
          }
          if (acc && typeof acc === "object" && acc.$max !== undefined) {
            var xv = items.map(function (d) { return resolveExpr(d, acc.$max); }).filter(function (v) { return v != null; });
            row[f] = xv.length ? xv.reduce(function (a, b) { return a > b ? a : b; }) : null; return;
          }
          if (acc && typeof acc === "object" && acc.$first !== undefined) { row[f] = items.length ? resolveExpr(items[0], acc.$first) : null; return; }
          if (acc && typeof acc === "object" && acc.$last !== undefined) { row[f] = items.length ? resolveExpr(items[items.length - 1], acc.$last) : null; return; }
          if (acc && typeof acc === "object" && acc.$count !== undefined) { row[f] = items.length; return; }
        });
        out.push(row);
      });
      return out;
    }
    if (key === "$sort") {
      out = docs.slice().sort(function (a, b) {
        var ks = Object.keys(spec);
        for (var i = 0; i < ks.length; i++) {
          var av = getVal(a, ks[i]), bv = getVal(b, ks[i]);
          if (av < bv) return -1 * spec[ks[i]];
          if (av > bv) return 1 * spec[ks[i]];
        }
        return 0;
      });
      return out;
    }
    if (key === "$limit") { return docs.slice(0, spec); }
    if (key === "$skip") { return docs.slice(spec); }
    if (key === "$count") { return [{ [spec]: docs.length }]; }
    if (key === "$unwind") {
      var path = typeof spec === "string" ? spec.slice(1) : spec.path.slice(1);
      var res = [];
      docs.forEach(function (d) {
        var arr = getVal(d, path);
        if (!Array.isArray(arr) || arr.length === 0) { if (typeof spec === "object" && spec.preserveNullAndEmptyArrays) res.push(Object.assign({}, d)); return; }
        arr.forEach(function (item, idx) {
          var o = Object.assign({}, d);
          setVal(o, path, item);
          if (typeof spec === "object" && spec.as) setVal(o, spec.as, idx);
          res.push(o);
        });
      });
      return res;
    }
    if (key === "$addFields" || key === "$set") {
      out = docs.map(function (d) { var o = Object.assign({}, d); Object.keys(spec).forEach(function (f) { var v = resolveExpr(d, spec[f]); if (v !== undefined) setVal(o, f, v); }); return o; });
      return out;
    }
    if (key === "$lookup") {
      out = docs.map(function (d) {
        var o = Object.assign({}, d);
        var foreignRows = (mongoCollections[spec.from] || []).filter(function (f) {
          var as = spec.as;
          if (spec.localField && spec.foreignField) return oidEq(getVal(d, spec.localField), getVal(f, spec.foreignField));
          if (spec.pipeline) return matches(f, spec.pipeline.reduce(function (acc, st) {
            var k2 = Object.keys(st)[0];
            if (k2 === "$match") Object.keys(st.$match).forEach(function (mk) { acc[mk] = st.$match[mk]; });
            return acc;
          }, {}));
          return false;
        });
        o[spec.as] = foreignRows;
        return o;
      });
      return out;
    }
    throw new Error("aggregate: неизвестный стади " + key);
  }
  var mongoCollections = Object.create(null);
  function coll(name) {
    var rows = (mongoCollections[name] = mongoCollections[name] || []);
    var indexes = [{ key: { _id: 1 }, name: "_id_" }];
    var self = {
      insertOne: function (doc) { var d = Object.assign({}, doc); if (d._id === undefined) d._id = new ObjectIdClass(); rows.push(d); return Promise.resolve({ insertedId: d._id }); },
      insertMany: function (docs) {
        var ds = docs.map(function (x) { var d = Object.assign({}, x); if (d._id === undefined) d._id = new ObjectIdClass(); return d; });
        rows.push.apply(rows, ds);
        return Promise.resolve({ insertedCount: ds.length, insertedIds: Object.fromEntries(ds.map(function (d) { return [String(d._id), d._id]; })) });
      },
      find: function (filter) {
        var result = rows.filter(function (d) { return matches(d, filter || {}); });
        var sel = null;
        var cursor = {
          toArray: function () {
            return Promise.resolve(sel ? result.map(function (d) {
              var excl = Object.values(sel).some(function (v) { return v === 0 || v === false; });
              if (excl) { var o = Object.assign({}, d); Object.keys(sel).forEach(function (k) { if (sel[k] === 0) setVal(o, k, undefined); }); return o; }
              var o2 = {};
              Object.keys(sel).forEach(function (k) { var v = getVal(d, k); if (v !== undefined) setVal(o2, k, v); });
              if (sel._id !== 0) o2._id = d._id;
              return o2;
            }) : result);
          },
          limit: function (n) { result = result.slice(0, n); return this; },
          skip: function (n) { result = result.slice(n); return this; },
          sort: function (obj) {
            var ks = Object.keys(obj);
            result.sort(function (a, b) {
              for (var i = 0; i < ks.length; i++) {
                var av = getVal(a, ks[i]), bv = getVal(b, ks[i]);
                if (av < bv) return -1 * obj[ks[i]];
                if (av > bv) return 1 * obj[ks[i]];
              }
              return 0;
            });
            return this;
          },
          project: function (p) { sel = p; return this; },
          count: function () { return Promise.resolve(result.length); },
        };
        return cursor;
      },
      findOne: function (filter) { return Promise.resolve(rows.find(function (d) { return matches(d, filter || {}); }) || null); },
      updateOne: function (filter, update, opts) {
        var doc = rows.find(function (d) { return matches(d, filter || {}); });
        if (doc) { applyUpdate(doc, update); return Promise.resolve({ matchedCount: 1, modifiedCount: 1, upsertedId: null }); }
        if (opts && opts.upsert) {
          var nd = {};
          Object.keys(filter).forEach(function (k) { if (k.charAt(0) !== "$" && (filter[k] == null || typeof filter[k] !== "object")) setVal(nd, k, filter[k]); });
          nd._id = new ObjectIdClass();
          applyUpdate(nd, update);
          rows.push(nd);
          return Promise.resolve({ matchedCount: 0, modifiedCount: 0, upsertedId: nd._id });
        }
        return Promise.resolve({ matchedCount: 0, modifiedCount: 0, upsertedId: null });
      },
      updateMany: function (filter, update) {
        var n = 0;
        rows.forEach(function (d) { if (matches(d, filter || {})) { applyUpdate(d, update); n++; } });
        return Promise.resolve({ matchedCount: n, modifiedCount: n });
      },
      replaceOne: function (filter, doc) {
        var d = rows.find(function (x) { return matches(x, filter || {}); });
        if (!d) return Promise.resolve({ matchedCount: 0, modifiedCount: 0 });
        var keep = d._id;
        for (var k in d) delete d[k];
        Object.assign(d, doc);
        d._id = keep;
        return Promise.resolve({ matchedCount: 1, modifiedCount: 1 });
      },
      deleteOne: function (filter) {
        var i = rows.findIndex(function (d) { return matches(d, filter || {}); });
        if (i >= 0) rows.splice(i, 1);
        return Promise.resolve({ deletedCount: i >= 0 ? 1 : 0 });
      },
      deleteMany: function (filter) { var b = rows.length; rows = rows.filter(function (d) { return !matches(d, filter || {}); }); return Promise.resolve({ deletedCount: b - rows.length }); },
      countDocuments: function (filter) { return Promise.resolve(rows.filter(function (d) { return matches(d, filter || {}); }).length); },
      estimatedDocumentCount: function () { return Promise.resolve(rows.length); },
      distinct: function (field, filter) {
        var seen = [];
        rows.filter(function (d) { return matches(d, filter || {}); }).forEach(function (d) { var v = getVal(d, field); if (!containsArr(seen, v)) seen.push(v); });
        return Promise.resolve(seen);
      },
      aggregate: function (pipeline) {
        var res = docs2 = rows;
        var docs2 = rows.slice();
        for (var i = 0; i < pipeline.length; i++) docs2 = aggregateStage(docs2, pipeline[i]);
        return { toArray: function () { return Promise.resolve(docs2); }, cursor: { toArray: function () { return Promise.resolve(docs2); } } };
      },
      createIndex: function (spec, opts) {
        var name = (opts && opts.name) || Object.keys(spec).map(function (k) { return k + "_" + spec[k]; }).join("_");
        indexes.push({ key: spec, name: name });
        return Promise.resolve(name);
      },
      createIndexes: function (specs) { return Promise.resolve(specs.map(function (s) { return self.createIndex(s.key, s); })); },
      listIndexes: function () { return Promise.resolve(indexes); },
      indexExists: function (name) { return Promise.resolve(indexes.some(function (i) { return i.name === name; })); },
      dropIndex: function (name) { var i = indexes.findIndex(function (x) { return x.name === name; }); if (i >= 0) indexes.splice(i, 1); return Promise.resolve(true); },
      drop: function () { rows.length = 0; return Promise.resolve(true); },
    };
    function docs2() {}
    return self;
  }
  function ObjectIdClass(s) {
    if (!(this instanceof ObjectIdClass)) return new ObjectIdClass(s);
    if (s && typeof s === "string" && /^[0-9a-f]{24}$/i.test(s)) this.__id = s.toLowerCase();
    else this.__id = oid();
  }
  ObjectIdClass.prototype.toString = function () { return this.__id; };
  ObjectIdClass.prototype.toHexString = function () { return this.__id; };
  ObjectIdClass.prototype.toJSON = function () { return this.__id; };
  ObjectIdClass.isValid = function (s) { if (s instanceof ObjectIdClass) return true; return typeof s === "string" && /^[0-9a-f]{24}$/i.test(s); };
  function MongoClientCtor(url) {
    if (!(this instanceof MongoClientCtor)) return new MongoClientCtor(url);
    this._url = url;
    this.db = function (name) { return { collection: function (n) { return coll(n); }, listCollections: function () { return { toArray: function () { return Promise.resolve(Object.keys(mongoCollections).map(function (k) { return { name: k }; })); } }; } }; };
    this.close = function () { return Promise.resolve(); };
    this.connection = { isConnected: function () { return true; } };
  }
  shims.mongodb = { MongoClient: MongoClientCtor, ObjectId: ObjectIdClass };
  window.__db = window.__db || {};
  window.__db.mongo = mongoCollections;

  // ---------- mongoose (mock поверх mongo-мока: Schema/Model, валидация required/defaults) ----------
  function mongooseSchema(def, opts) {
    return { def: def || {}, opts: opts || {}, methods: {}, virtuals: {}, statics: {}, indexes: [],
      method: function (n, fn) { this.methods[n] = fn; return this; },
      virtual: function (n) { this.virtuals[n] = true; return this; },
      static: function (n, fn) { this.statics[n] = fn; return this; },
      index: function (spec, o) { this.indexes.push({ key: spec, options: o }); return this; } };
  }
  function mongooseCast(type, value, path) {
    if (value === undefined || value === null) return value;
    if (type === "String" || type === String) return String(value);
    if (type === "Number" || type === "Int32" || type === Number) return Number(value);
    if (type === "Boolean" || type === Boolean) return Boolean(value);
    if (type === "Date") return value instanceof Date ? value : new Date(value);
    if (type === "ObjectId" || (typeof type === "function" && type.name === "ObjectIdClass")) return value instanceof ObjectIdClass ? value : new ObjectIdClass(String(value));
    return value;
  }
  function mongooseModel(dbName, name, schema) {
    var collection = coll(name.toLowerCase() + "s");
    var Model = function (doc) {
      if (!(this instanceof Model)) return new Model(doc);
      this.$isNew = true;
      this.$__init(doc || {});
    };
    Model.schema = schema;
    Model.collection = collection;
    Model.modelName = name;
    Model.collectionName = name.toLowerCase() + "s";
    function validate(doc, isUpdate) {
      var errs = [];
      Object.keys(schema.def).forEach(function (k) {
        var t = schema.def[k];
        var type = typeof t === "object" ? t.type : t;
        var isArr = Array.isArray(type);
        var base = isArr ? type[0] : type;
        var req = (typeof t === "object" && !Array.isArray(t) && t.required) || t === "required";
        var def = (typeof t === "object" && !Array.isArray(t) && t.default !== undefined) ? t.default : undefined;
        var v = getVal(doc, k);
        if (v === undefined && def !== undefined) v = typeof def === "function" ? def() : (Array.isArray(def) ? def.slice() : def);
        var empty = v === undefined || v === null || (typeof v === "string" && v.trim() === "");
        if (empty) {
          if (req && !isUpdate) errs.push(k + " (required)");
          return;
        }
        if (base === "String" || base === String) { if (typeof v !== "string") errs.push(k +": должен быть String"); }
        else if (base === "Number" || base === "Int32" || base === Number) { if (typeof v !== "number" || isNaN(v)) errs.push(k + ": должен быть Number"); }
        else if (base === "Boolean" || base === Boolean) { if (typeof v !== "boolean") errs.push(k + ": должен быть Boolean"); }
      });
      return errs;
    }
    function toDoc(m) {
      var o = {};
      Object.keys(m).forEach(function (k) { if (k.charAt(0) !== "$") o[k] = m[k]; });
      return o;
    }
    Model.prototype.$__init = function (doc) {
      var self = this;
      Object.keys(doc).forEach(function (k) { self[k] = doc[k]; });
      if (!this._id) this._id = new ObjectIdClass();
    };
    Model.prototype.save = function () {
      var self = this;
      var errs = validate(toDoc(this), !this.$isNew);
      if (errs.length) return Promise.reject(Object.assign(new Error("ValidationError: " + errs.join(", ")), { name: "ValidationError", errors: {} }));
      if (this.$isNew) {
        var d = toDoc(this);
        if (d._id === undefined) d._id = new ObjectIdClass();
        rows0.push(d);
        self.$isNew = false;
        self._id = d._id;
        return Promise.resolve(this);
      }
      var selfDoc = toDoc(this);
      var upd = {};
      Object.keys(selfDoc).forEach(function (k) { if (k !== "_id") upd[k] = selfDoc[k]; });
      collection.updateOne({ _id: this._id }, { $set: upd });
      return Promise.resolve(this);
    };
    var rows0 = collection.__rowsProxy();
    Model.find = function (filter) {
      var c = collection.find(filter || {});
      var wrap = {
        then: function (res) { return c.toArray().then(res); },
        sort: function () { c.sort.apply(c, arguments); return this; },
        skip: function () { c.skip.apply(c, arguments); return this; },
        limit: function () { c.limit.apply(c, arguments); return this; },
        select: function () { return this; },
      };
      return wrap;
    };
    Model.findOne = function (filter) { return collection.findOne(filter || {}); };
    function applyDefaults(doc) {
      var d = Object.assign({}, doc);
      Object.keys(schema.def).forEach(function (k) {
        var t = schema.def[k];
        if (d[k] === undefined && typeof t === "object" && !Array.isArray(t) && t.default !== undefined) d[k] = typeof t.default === "function" ? t.default() : (Array.isArray(t.default) ? t.default.slice() : t.default);
      });
      return d;
    }
    Model.create = function (doc) {
      var d0 = applyDefaults(doc);
      var errs = validate(d0, false);
      if (errs.length) return Promise.reject(Object.assign(new Error("ValidationError: " + errs.join(", ")), { name: "ValidationError" }));
      return collection.insertOne(d0).then(function (r) {
        return Object.assign({}, d0, { _id: r.insertedId });
      });
    };
    Model.countDocuments = function (filter) { return collection.countDocuments(filter || {}); };
    Model.deleteOne = function (filter) { return collection.deleteOne(filter || {}); };
    Model.deleteMany = function (filter) { return collection.deleteMany(filter || {}); };
    Model.updateOne = function (filter, update) { return collection.updateOne(filter || {}, update); };
    Model.updateMany = function (filter, update) { return collection.updateMany(filter || {}, update); };
    Model.findById = function (id) { return collection.findOne({ _id: new ObjectIdClass(String(id)) }); };
    Model.findByIdAndUpdate = function (id, update, opts) {
      return collection.updateOne({ _id: new ObjectIdClass(String(id)) }, update, opts).then(function (r) {
        if (opts && opts.new) return collection.findOne({ _id: new ObjectIdClass(String(id)) });
        return r;
      });
    };
    Model.findOneAndUpdate = function (filter, update, opts) {
      return collection.updateOne(filter || {}, update, opts).then(function (r) {
        if (opts && (opts.new || opts.returnDocument === "after")) return collection.findOne(filter);
        return r;
      });
    };
    Model.aggregate = function (pipeline) { return collection.aggregate(pipeline); };
    Model.distinct = function (f, fl) { return collection.distinct(f, fl || {}); };
    Model.createIndex = function (spec, o) { return collection.createIndex(spec, o); };
    Model.indexes = function () { return schema.indexes; };
    Object.keys(schema.methods).forEach(function (n) { Model.prototype[n] = schema.methods[n]; });
    Object.keys(schema.statics).forEach(function (n) { Model[n] = schema.statics[n]; });
    return Model;
  }
  var mongooseMock = {
    Schema: mongooseSchema,
    model: function (name, schema) { return mongooseModel("sandbox", name, schema); },
    connect: function (url) {
      console.debug("[mongoose:sandbox] connect " + url);
      return Promise.resolve({ connections: [0] });
    },
    connection: { readyState: 1, db: { name: "sandbox" } },
    set: function () {},
  };
  shims.mongoose = mongooseMock;
  // встраиваем __rowsProxy в coll (до использования)
  var origColl = coll;
  coll = function (name) {
    var c = origColl(name);
    c.__rowsProxy = function () { return mongoCollections[name]; };
    return c;
  };

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
