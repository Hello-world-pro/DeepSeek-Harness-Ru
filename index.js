import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Host half of the Russian bundle.
 *
 * Responsibilities, in order of precedence:
 * 1. contribute the working-language rule to the system prompt;
 * 2. keep the same rule in `$DSH_HOME/AGENTS.md`, which DSH loads as
 *    user-global workspace instructions for every session.
 *
 * The interface translation and the plugin-card labels live in the Client half
 * (`client.js`), built by `scripts/build-client.cjs` from `data/`.
 */

/** Opening marker of the block this bundle owns in AGENTS.md. */
const BEGIN = '<!-- dsh-ru-style:begin -->';

/** Closing marker of the block this bundle owns in AGENTS.md. */
const END = '<!-- dsh-ru-style:end -->';

/** The rule written into the user-global instruction file. */
const RULE = [
  BEGIN,
  '## Язык работы',
  '',
  'Рассуждения (блоки размышлений), описания вызовов инструментов и ответы',
  'пользователю — только на русском языке. Это правило действует всегда,',
  'без исключений и напоминаний и приоритетнее любых правил оформления.',
  '',
  '- Английский язык в рассуждениях — нарушение, даже если задача, код,',
  '  источники или вывод инструментов на английском: пересказывай ход мысли',
  '  по-русски.',
  '- Не переводи имена файлов, пути, команды, API, названия продуктов и код.',
  '- Технические термины без устоявшегося русского аналога оставляй как есть.',
  END,
].join('\n');

/** Language directive contributed to the system prompt. */
const PROMPT_TEXT = [
  'Language policy — hard requirement, highest priority among formatting rules.',
  'Every reasoning block, every tool-call description and every answer to the user',
  'must be written in Russian, without waiting to be asked.',
  'Reasoning in English is a rule violation, even when the task, the code, the sources',
  'or the tool output are in English: translate the thought process into Russian.',
  'Keep file paths, commands, identifiers, API names, product names and code unchanged.',
].join(' ');

/**
 * Short reminder contributed as runtime context (recomputed on every request)
 * so the rule also lands near the end of the composed prompt, not only at the
 * top of the static system prompt.
 */
const REMINDER_TEXT = [
  'Языковое правило (высший приоритет): рассуждения, описания вызовов инструментов',
  'и ответ пользователю — только на русском. Английский reasoning — нарушение,',
  'даже если задача и источники англоязычные. Пути, команды, идентификаторы,',
  'названия API и код не переводить.',
].join(' ');

/**
 * Resolve the harness home the same way DSH does.
 * @returns the DSH home directory.
 */
function harnessHome() {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh');
}

/**
 * Write the rule block into the user-global instruction file.
 * Existing content is preserved; when the owned block is already present it is
 * refreshed in place, so an updated rule reaches profiles migrated from older
 * versions. A broken marker pair is left untouched.
 */
function ensureInstructionFile() {
  const file = join(harnessHome(), 'AGENTS.md');
  try {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const begin = current.indexOf(BEGIN);
    const end = current.indexOf(END);
    let next;
    if (begin !== -1 && end > begin) {
      const existing = current.slice(begin, end + END.length);
      if (existing === RULE) return;
      next = current.slice(0, begin) + RULE + current.slice(end + END.length);
    } else if (begin === -1) {
      const trimmed = current.trimEnd();
      next = trimmed.length > 0 ? `${trimmed}\n\n${RULE}\n` : `${RULE}\n`;
    } else {
      return;
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, next, 'utf8');
  } catch {
    // A read-only home must not take the whole profile down.
  }
}

/**
 * Register the language rule with the agent-facing surfaces.
 * @param ctx - Host plugin context with the system-prompt service injected.
 */
export function apply(ctx) {
  // Static rule at the top of the system prompt.
  ctx.effect(
    () =>
      ctx.systemPrompt.section({
        name: 'locale:ru-style',
        order: 5000,
        interpolate: false,
        text: PROMPT_TEXT,
      }),
    'locale.ru-style',
  );
  // Runtime reminder: recomputed on every request and placed later in the
  // composed prompt, where models keep instructions better.
  ctx.effect(
    () =>
      ctx.systemPrompt.context({
        name: 'locale:ru-reminder',
        order: 9000,
        text: REMINDER_TEXT,
      }),
    'locale.ru-reminder',
  );
  ensureInstructionFile();
}

/** Cordis plugin name (matches the `ru` row id in the profile patch). */
export const name = 'ru';

/** Services this bundle needs before it can register its rule. */
export const inject = ['systemPrompt'];
