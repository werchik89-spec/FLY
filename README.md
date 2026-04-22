# Schoolboy Runaway Cheats (MelonLoader mod)

Mod для **Schoolboy Runaway** на Steam (Unity). Внутриигровое меню с читами:

| Чит | Клавиша | Что делает |
|---|---|---|
| Открыть/скрыть меню | `Insert` | Показать IMGUI-меню с тогглами и слайдерами |
| Fly | `F1` | Свободный полёт: `WASD` + `Space/C` по вертикали, `Shift` — ускорение |
| Noclip | `F2` | Проход сквозь стены (отключает коллайдеры игрока) |
| Infinite Stamina | `F3` | Постоянно записывает максимум в поля `stamina`/`energy` игрока |
| Speedhack | `F4` | Множитель `Time.timeScale` (slider в меню) |
| Teleport save | `F5` | Запомнить текущую позицию |
| Teleport load | `F6` | Телепорт на сохранённую позицию |
| Unlock all doors | кнопка в меню | Сбрасывает `isLocked` у всех сцена-объектов со словом `Door`/`Lock` в имени класса |
| Collect all pickups | кнопка в меню | Вызывает `Pickup()/Collect()` на всех объектах со словом `Pickup`/`Gift` |

> **Важно:** это мод для одиночной игры. Не используйте в мультиплеере/соревновательных режимах.

## Установка

1. **Установи MelonLoader v0.6.6+** ([LavaGang/MelonLoader](https://github.com/LavaGang/MelonLoader/releases)):
   - Скачай `MelonLoader.Installer.exe`
   - Запусти, выбери `Schoolboy Runaway.exe` из Steam-папки игры
   - Нажми `INSTALL` (автоматически определит Mono/IL2CPP)
2. **Собери или скачай `SchoolboyRunawayCheats.dll`:**
   - CI-артефакт из Actions в этом репо → `SchoolboyRunawayCheats.dll`
   - Или локально: см. раздел «Сборка»
3. **Положи DLL** в папку:
   ```
   <Steam>\steamapps\common\Schoolboy Runaway\Mods\SchoolboyRunawayCheats.dll
   ```
4. **Запусти игру.** При первом запуске MelonLoader долго (1–3 мин) генерирует proxy-DLL для IL2CPP — это нормально.
5. В игре нажми `Insert` — появится меню читов.

## Первый запуск не смог найти игрока / читы не работают

Это значит эвристический поиск не угадал имя класса игрока. Нужно дополнить `src/GameBindings.cs`:

1. После первого запуска MelonLoader сгенерит proxy-ассембли в:
   ```
   Schoolboy Runaway\MelonLoader\Il2CppAssemblyGenerator\Il2CppInteropOutput\
   ```
2. Открой `Assembly-CSharp.dll` (или похожий) в [dnSpyEx](https://github.com/dnSpyEx/dnSpy) или [ILSpy](https://github.com/icsharpcode/ILSpy).
3. Найди класс игрока (обычно `Player`, `PlayerController`, `FirstPersonController` и т.п.) — у него будут поля `stamina`, методы движения, ссылка на `CharacterController`.
4. Запиши FullName или короткое имя класса в `GameBindings.PlayerTypeName`.
5. Аналогично заполни `DoorTypeName`, `PickupTypeName` и имена полей/методов.
6. Пересобери DLL.

Если нужна помощь — приложи файлы к issue и я заполню биндинги сам.

## Сборка

Требуется **.NET 6 SDK**.

```bash
# Linux / macOS
./scripts/fetch-refs.sh
dotnet build src/SchoolboyRunawayCheats.csproj -c Release
# → src/bin/Release/SchoolboyRunawayCheats.dll
```

```powershell
# Windows
# Скачай https://github.com/LavaGang/MelonLoader/releases/download/v0.6.6/MelonLoader.x64.zip
# Положи MelonLoader.dll, 0Harmony.dll, Il2CppInterop.Runtime.dll в .\lib\
dotnet build src\SchoolboyRunawayCheats.csproj -c Release
```

## Структура проекта

```
src/
  SchoolboyRunawayCheats.csproj   # ссылается на MelonLoader (lib/) + UnityEngine.Modules (NuGet)
  Mod.cs                          # MelonMod, хоткеи, тик
  Menu.cs                         # IMGUI-меню
  PlayerLocator.cs                # эвристический поиск игрока / камеры
  GameBindings.cs                 # места для вписывания реальных имён классов
  ReflectionUtil.cs               # helpers для чтения/записи полей/свойств
  Cheats/
    Fly.cs, Noclip.cs, Speedhack.cs,
    InfiniteStamina.cs, Teleport.cs,
    UnlockDoors.cs, CollectPickups.cs
lib/                              # MelonLoader refs, качаются скриптом/CI, в git не коммитятся
.github/workflows/build.yml       # CI сборка с артефактом
scripts/fetch-refs.sh             # качает MelonLoader refs локально
```

## Совместимость

- Unity **Mono** и **IL2CPP** (MelonLoader 0.6 поддерживает оба, net6 mod DLL).
- Тестировалось против API Unity 2021.3; игра, вероятно, на близкой версии (мобильный порт).
- Если CharacterController/Rigidbody игрока устроен нестандартно — сначала включи мод, подвигайся, потом активируй чит (локатор отработает по Camera.main).

## Отказ от ответственности

Мод для оффлайн/одиночной игры, без онлайн-взаимодействия. Используешь на свой страх и риск — античит в игре отсутствует, но Steam-достижения могут быть затронуты.
