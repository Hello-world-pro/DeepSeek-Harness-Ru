# DeepSeek Harness Ru

Русская локализация [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness):
русский интерфейс, русские названия карточек плагинов и русский язык работы
агента.

[![verify](https://github.com/Hello-world-pro/DeepSeek-Harness-Ru/actions/workflows/verify.yml/badge.svg)](https://github.com/Hello-world-pro/DeepSeek-Harness-Ru/actions/workflows/verify.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Возможности

| Что | Как устроено |
|---|---|
| **Интерфейс** | язык `ru` в каталоге локалей и 59 словарей — 2681 строка: чат, настройки, боковые панели, диалоги, подсказки |
| **Карточки плагинов** | названия и описания на странице «Плагины»: их метаданные поставляются только на английском и китайском, поэтому строки подменяются на странице по таблице |
| **Язык агента** | секция системного промпта плюс блок в `$DSH_HOME/AGENTS.md`: рассуждения, описания инструментов и ответы — по-русски |

## Установка

### Из Git-адреса (рекомендуется)

Самый короткий путь: DSH сам склонирует репозиторий и включит плагин.

1. В DSH: **сайдбар → Plugins → Add plugin**.
2. Вставьте адрес репозитория:

   ```
   https://github.com/Hello-world-pro/DeepSeek-Harness-Ru
   ```

   Короткая форма тоже работает: `github:Hello-world-pro/DeepSeek-Harness-Ru`.
3. Нажмите **Install**.
4. **Настройки → Основные → Язык → Русский**.
5. Перезапустите приложение один раз — чтобы правило языка попало в системный
   промпт.

Так вы получаете последнюю версию из ветки `main`. Учтите: при обновлении
репозитория установленный плагин остаётся на том коммите, который был скачан
при установке — чтобы обновиться, удалите плагин и установите заново.

### Из релиза

Если нужна фиксированная версия, а не текущая ветка:

1. Откройте [Releases](https://github.com/Hello-world-pro/DeepSeek-Harness-Ru/releases),
   выберите нужную версию (например, `v1.0.0`) и скачайте **Source code (zip)**.
2. Распакуйте архив в постоянное место — папка не должна переезжать после
   установки, DSH ссылается на неё по пути.
3. **Plugins → Add plugin** → вставьте абсолютный путь к распакованной папке →
   **Install**.
4. **Настройки → Основные → Язык → Русский**.
5. Перезапустите приложение один раз.

### Вручную

```bash
# профиль DSH лежит в ~/.dsh/profiles/<profile>
ln -s /path/to/deepseek-harness-ru ~/.dsh/profiles/desktop/node_modules/deepseek-harness-ru
# Windows: mklink /J "%USERPROFILE%\.dsh\profiles\desktop\node_modules\deepseek-harness-ru" "C:\path\to\deepseek-harness-ru"
```

Затем добавьте зависимость `"deepseek-harness-ru": "link:/path/to/deepseek-harness-ru"`
в `package.json` профиля и строку в `cordis.patch.yml`:

```yaml
- insert:
    - id: ru
      name: "deepseek-harness-ru"
```

## Требования

- DeepSeek Harness `0.2.1-rc.x` (проверено на десктопной сборке).
- Node.js не нужен для установки: `client.js` уже собран.

## Структура

```
deepseek-harness-ru/
├── package.json                 манифест: dsh.bundle.patch + dsh.client
├── cordis.patch.yml             одна строка плагина в профиле
├── index.js                     хост-половина: системный промпт и AGENTS.md
├── client.js                    собранный клиентский модуль (генерируется)
├── data/
│   ├── dictionary.ru.json       словари интерфейса: namespace → { ключ: перевод }
│   └── meta-translations.json   названия и описания карточек плагинов
├── scripts/
│   ├── build-client.cjs         сборка client.js из data/
│   └── test-client.cjs          проверка модуля в тестовом DOM
├── locale/{en,zh}.json          метаданные карточки в Plugins
├── icon.svg
└── README.md
```

## Разработка

Правки вносятся только в `data/`: `client.js` — артефакт сборки.

```bash
node scripts/build-client.cjs   # пересобрать клиентский модуль
node scripts/test-client.cjs    # проверить язык, словари и подмену
```

После правок обновите страницу в DSH — **Ctrl+F5**, иначе браузер возьмёт
старый модуль из кэша. Перезапуск приложения нужен, только если менялись
`index.js` или `package.json`.

Правила перевода и порядок работы описаны в [CONTRIBUTING.md](CONTRIBUTING.md),
изменения — в [CHANGELOG.md](CHANGELOG.md).

## Ограничения

- Карточки плагинов, которых нет в `meta-translations.json`, остаются на
  английском: подмена идёт по точному совпадению строки.
- При крупном обновлении DSH часть ключей может измениться — словарь придётся
  актуализировать.
- Перевод относится к ветке `0.2.1-rc.x`.

## Лицензия

[MIT](LICENSE). DeepSeek Harness распространяется по своей лицензии; этот
пакет содержит только тексты локализации и код плагина.
