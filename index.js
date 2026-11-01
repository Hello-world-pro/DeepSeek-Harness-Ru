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
  'без исключений и напоминаний.',
  '',
  '- Не переводи имена файлов, пути, команды, API, названия продуктов и код.',
  '- Технические термины без устоявшегося русского аналога оставляй как есть.',
  END,
].join('\n');

/** Language directive contributed to the system prompt. */
const PROMPT_TEXT = [
  'Working language: Russian.',
  'Every reasoning block, every tool-call description and every answer to the user',
  'must be written in Russian, without waiting to be asked.',
  'Keep file paths, commands, identifiers, API names, product names and code unchanged.',
].join(' ');

/**
 * Resolve the harness home the same way DSH does.
 * @returns the DSH home directory.
 */
function harnessHome() {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh');
}

/**
 * Write the rule block into the user-global instruction file when it is absent.
 * Existing content is preserved; a file that already carries the block is left
 * untouched, so an edit made by hand is never overwritten.
 */
function ensureInstructionFile() {
  const file = join(harnessHome(), 'AGENTS.md');
  try {
    const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (current.includes(BEGIN)) return;
    const trimmed = current.trimEnd();
    const next = trimmed.length > 0 ? `${trimmed}\n\n${RULE}\n` : `${RULE}\n`;
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
  ctx.systemPrompt.section({
    name: 'locale:ru-style',
    order: 5000,
    text: PROMPT_TEXT,
  });
  ensureInstructionFile();
}

/** Services this bundle needs before it can register its rule. */
export const inject = ['systemPrompt'];
