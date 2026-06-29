# BlackSoul Garry's Mod GitHub Theme

Готовый пакет темы для Garry's Mod, основа взята отсюда - https://github.com/JWalkerMailly/Derma-Github-Theme

## Что внутри

Папка `garrysmod` содержит измененные файлы:

- `html` - главное меню, страницы "Начать новую игру", "Серверы", loading HTML.
- `backgrounds` - фоны главного меню.
- `gamemodes/base/backgrounds/bg.jpg` - темный fallback-фон для ранней загрузки.
- `gamemodes/sandbox/backgrounds` - fallback-фоны sandbox splash/loading экрана.
- `gamemodes/sandbox/logo.png` и `gamemodes/sandbox/1logo.png` - splash-логотип BlackSoul.
- `materials/console` - темный Source/engine loading background.
- `materials/resource/SourceScheme.res` - темная схема для раннего экрана запуска игры.
- `resource/SourceScheme.res` - темная Source/VGUI тема и шрифты.
- `resource/Mona-Sans.ttf`
- `resource/SourceCodePro-VariableFont_wght.ttf`
- `resource/fonts/Mona-Sans.ttf`
- `addons/Derma-Github-Theme-1.0.0` - темная Derma/spawnmenu тема.

## Установка

1. Полностью закрой Garry's Mod.
2. Открой папку игры:

   `...\Steam\steamapps\common\GarrysMod\`

3. Скопируй из этого пакета папку `garrysmod` прямо в `GarrysMod`.
4. Согласись на замену файлов.
5. Не удаляй свою папку `garrysmod\html` перед копированием. Нужно копировать поверх, иначе могут пропасть штатные JS-файлы меню.
6. Запусти Garry's Mod заново.

## Если Steam перезаписал тему

После Verify Integrity, смены beta/dev/x86-x64 ветки или обновления игры Steam может вернуть стандартные файлы. Тогда просто повтори установку.

