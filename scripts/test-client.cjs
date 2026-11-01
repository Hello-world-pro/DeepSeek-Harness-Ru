const fs = require("fs");
let mod = null;
global.window = { __ModuleLoader__: { load({ id, factory }) { mod = factory(() => { throw new Error("no require"); }); mod.__id = id; } } };
global.NodeFilter = { SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1 };
const nodes = [
  { nodeValue: "Session search", parentElement: { tagName: "SPAN" } },
  { nodeValue: "не трогать", parentElement: { tagName: "SPAN" } },
];
let i = -1;
global.document = { body: {}, createTreeWalker: () => ({ nextNode: () => (++i < nodes.length ? nodes[i] : null) }) };
global.MutationObserver = class { constructor(cb) { this.cb = cb; } observe() {} disconnect() {} };
new Function("window", fs.readFileSync("C:/Users/Dima/Documents/deepseek-harness/default-workspace/dsh-ru/client.js", "utf8"))(global.window);
const langs = [], dicts = [];
const ctx = {
  effect(fn) { const d = fn(); return typeof d === "function" ? d : () => {}; },
  locale: {
    addLanguage(l) { langs.push(l); return () => {}; },
    register(ns, id, e) { dicts.push([ns, id, Object.keys(e).length]); return () => {}; },
  },
};
mod.apply(ctx);
console.log("id:", mod.__id);
console.log("языки:", JSON.stringify(langs));
console.log("словарей:", dicts.length, "| ключей:", dicts.reduce((a, d) => a + d[2], 0));
console.log("подмена:", nodes.map(n => n.nodeValue).join(" || "));
