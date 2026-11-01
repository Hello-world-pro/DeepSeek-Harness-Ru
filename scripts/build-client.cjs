process.noAsar = true;
/**
 * Собирает клиентскую половину пакета (`client.js`) из данных в `data/`:
 * словаря интерфейса и таблицы названий карточек плагинов.
 *
 * Запуск: node scripts/build-client.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const pkgRoot = path.resolve(__dirname, '..');
const dictionary = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'data', 'dictionary.ru.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'data', 'meta-translations.json'), 'utf8'));

const PACKAGE_ID = 'deepseek-harness-ru';
const namespaces = Object.keys(dictionary).sort();

const dictionaryBody = namespaces
  .map((ns) => `\t\t${JSON.stringify(ns)}: ${JSON.stringify(dictionary[ns], null, '\t').replace(/\n/g, '\n\t\t')},`)
  .join('\n');

const metaBody = Object.entries(meta)
  .map(([en, ru]) => `\t\t\t${JSON.stringify(en)}: ${JSON.stringify(ru)},`)
  .join('\n');

const out = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(PACKAGE_ID)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\t/**
\t\t* Language definition offered to the Client locale catalog. "Русский" appears
\t\t* in Settings → General → Language next to the shipped English and Chinese.
\t\t* The fallback is English, so any key this pack does not translate keeps the
\t\t* shipped English copy instead of showing the raw key.
\t\t*/
\t\tconst LANGUAGE = Object.freeze({ id: "ru", label: "Русский", fallback: "en" });
\t\t/** Namespace -> Russian dictionary, registered through the locale service. */
\t\tconst DICTIONARIES = {
${dictionaryBody}
\t\t};
\t\t/**
\t\t* Plugin cards render their title and description from package metadata, which
\t\t* only carries en/zh and never reaches the dictionary registry. These exact
\t\t* strings are swapped in the page instead; anything absent stays as shipped.
\t\t*/
\t\tconst META_TRANSLATIONS = {
${metaBody}
\t\t};
\t\t/** Elements whose text must never be rewritten. */
\t\tconst SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);
\t\t/**
\t\t* Replace known English package strings in text nodes under the given root.
\t\t* @param root - subtree to scan.
\t\t*/
\t\tfunction translateRoot(root) {
\t\t\tconst walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
\t\t\t\tacceptNode(node) {
\t\t\t\t\tconst parent = node.parentElement;
\t\t\t\t\tif (!parent || SKIP.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
\t\t\t\t\treturn NodeFilter.FILTER_ACCEPT;
\t\t\t\t}
\t\t\t});
\t\t\tlet node;
\t\t\twhile ((node = walker.nextNode())) {
\t\t\t\tconst raw = node.nodeValue;
\t\t\t\tif (!raw) continue;
\t\t\t\tconst trimmed = raw.trim();
\t\t\t\tconst translated = META_TRANSLATIONS[trimmed];
\t\t\t\tif (!translated || translated === trimmed) continue;
\t\t\t\tconst start = raw.indexOf(trimmed);
\t\t\t\tnode.nodeValue = raw.slice(0, start) + translated;
\t\t\t}
\t\t}
\t\t/**
\t\t* Register the language, every namespace dictionary and the package-label
\t\t* observer as owned effects, so unloading the bundle removes them again.
\t\t* @param ctx - Client plugin context with the locale service injected.
\t\t*/
\t\tfunction apply(ctx) {
\t\t\tctx.effect(() => ctx.locale.addLanguage(LANGUAGE), "ru: language definition");
\t\t\tfor (const ns of Object.keys(DICTIONARIES)) {
\t\t\t\tconst entries = DICTIONARIES[ns];
\t\t\t\tctx.effect(() => ctx.locale.register(ns, "ru", entries), "ru: " + ns);
\t\t\t}
\t\t\tctx.effect(() => {
\t\t\t\tlet scheduled = false;
\t\t\t\tconst run = () => {
\t\t\t\t\tscheduled = false;
\t\t\t\t\ttry {
\t\t\t\t\t\ttranslateRoot(document.body);
\t\t\t\t\t} catch {
\t\t\t\t\t\t/* the page may be mid-navigation */
\t\t\t\t\t}
\t\t\t\t};
\t\t\t\tconst observer = new MutationObserver(() => {
\t\t\t\t\tif (scheduled) return;
\t\t\t\t\tscheduled = true;
\t\t\t\t\tsetTimeout(run, 30);
\t\t\t\t});
\t\t\t\tobserver.observe(document.body, { childList: true, subtree: true, characterData: true });
\t\t\t\trun();
\t\t\t\treturn () => observer.disconnect();
\t\t\t}, "ru: package label observer");
\t\t}
\t\texports.apply = apply;
\t\texports.inject = ["locale"];
\t\treturn module.exports;
\t}
});
`;

fs.writeFileSync(path.join(pkgRoot, 'client.js'), out);
console.log('sections:', namespaces.length, '| meta labels:', Object.keys(meta).length, '| bytes:', out.length);
