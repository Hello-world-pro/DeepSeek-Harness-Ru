const fs = require("node:fs");
const path = require("node:path");

let mod = null;
global.window = {
  __ModuleLoader__: {
    load({ id, factory }) {
      mod = factory(() => { throw new Error("no require"); });
      mod.__id = id;
    },
  },
};
global.NodeFilter = { SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1 };

const nodes = [
  { nodeValue: "Session search", parentElement: { tagName: "SPAN" } },
  { nodeValue: "не трогать", parentElement: { tagName: "SPAN" } },
];
let i = -1;
global.document = {
  body: {},
  createTreeWalker: () => ({ nextNode: () => (++i < nodes.length ? nodes[i] : null) }),
};
global.MutationObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {}
  disconnect() {}
};

const clientPath = path.join(__dirname, "..", "client.js");
new Function("window", fs.readFileSync(clientPath, "utf8"))(global.window);

const langs = [];
const dicts = [];
const ctx = {
  effect(fn) { const d = fn(); return typeof d === "function" ? d : () => {}; },
  locale: {
    addLanguage(l) { langs.push(l); return () => {}; },
    register(ns, id, entries) { dicts.push([ns, id, Object.keys(entries).length]); return () => {}; },
  },
};

mod.apply(ctx);

const keys = dicts.reduce((sum, d) => sum + d[2], 0);
const errors = [];
if (mod.__id !== "deepseek-harness-ru") errors.push(`id модуля: ${mod.__id}`);
if (langs.length !== 1 || langs[0].id !== "ru") errors.push(`языки: ${JSON.stringify(langs)}`);
if (dicts.length < 50) errors.push(`словарей: ${dicts.length}`);
if (keys < 2000) errors.push(`ключей: ${keys}`);
if (nodes[0].nodeValue !== "Поиск по сессиям") errors.push(`подмена не сработала: ${nodes[0].nodeValue}`);
if (nodes[1].nodeValue !== "не трогать") errors.push(`подменилась чужая строка: ${nodes[1].nodeValue}`);

console.log(`id: ${mod.__id}`);
console.log(`языки: ${JSON.stringify(langs)}`);
console.log(`словарей: ${dicts.length} | ключей: ${keys}`);
console.log(`подмена: ${nodes.map((n) => n.nodeValue).join(" || ")}`);

if (errors.length > 0) {
  console.error(`\nОШИБКИ:\n${errors.map((e) => ` - ${e}`).join("\n")}`);
  process.exitCode = 1;
}
