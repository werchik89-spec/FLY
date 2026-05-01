# Schoolboy Runaway Trainer (WinForms launcher)

`.exe` с окном для установки и запуска читов.

## Что делает

- Находит Schoolboy Runaway в Steam-библиотеках (registry → `libraryfolders.vdf` → `appmanifest_3359320.acf`).
- Позволяет выбрать папку игры вручную (если авто-поиск не нашёл).
- По кнопке «Установить MelonLoader + мод»:
  - скачивает `MelonLoader.x64.zip` v0.6.6 с GitHub,
  - распаковывает в папку игры,
  - копирует `SchoolboyRunawayCheats.dll` из папки рядом с trainer.exe в `…\Mods\`.
- Кнопки: Обновить DLL, Запустить через Steam, Запустить напрямую, Открыть Mods, Удалить.

## Сборка

CI собирает `publish/SchoolboyRunawayTrainer.exe` как single-file self-contained win-x64 (не нужен .NET runtime на машине юзера) и бандлит `SchoolboyRunawayCheats.dll` рядом. Артефакт: **SchoolboyRunawayTrainer-win-x64** в Actions.

Локально на Windows:
```powershell
dotnet publish trainer\SchoolboyRunawayTrainer.csproj -c Release -r win-x64 --self-contained true `
  /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true -o publish
# Положить SchoolboyRunawayCheats.dll рядом
Copy-Item src\bin\Release\SchoolboyRunawayCheats.dll publish\
```

## Использование

1. Распакуй архив `SchoolboyRunawayTrainer-win-x64.zip`.
2. Запусти `SchoolboyRunawayTrainer.exe` (Windows может спросить подтверждение — unsigned binary).
3. Проверь, что путь к игре найден. Жми «Установить MelonLoader + мод».
4. «Запустить через Steam». Через 1–3 минуты (первый запуск MelonLoader генерит proxy-ассембли) игра откроется.
5. В игре нажми `Insert` — меню читов. Хоткеи: `F1`–`F10`.
