using System;
using System.Drawing;
using System.IO;
using System.Runtime.Versioning;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SchoolboyRunawayTrainer;

[SupportedOSPlatform("windows")]
public sealed class MainForm : Form
{
    private readonly TextBox _pathBox;
    private readonly TextBox _logBox;
    private readonly Label _status;
    private readonly Button _btnSetup;
    private readonly Button _btnLaunchSteam;
    private readonly Button _btnLaunchDirect;
    private readonly Button _btnOpenMods;
    private readonly Button _btnUninstall;
    private readonly Button _btnUpdateDll;
    private readonly ProgressBar _progress;

    private string? _gameDir;

    public MainForm()
    {
        Text = "Schoolboy Runaway — Cheat Trainer";
        Size = new Size(720, 560);
        MinimumSize = new Size(600, 480);
        StartPosition = FormStartPosition.CenterScreen;
        Font = new Font("Segoe UI", 9f);

        var header = new Label
        {
            Text = "Schoolboy Runaway — читы (MelonLoader)",
            Font = new Font("Segoe UI Semibold", 14f, FontStyle.Bold),
            Location = new Point(12, 10),
            AutoSize = true,
        };
        var sub = new Label
        {
            Text = "1) Найди игру. 2) Установи MelonLoader + мод. 3) Запусти. В игре: Insert — меню, F1–F10 — хоткеи.",
            Location = new Point(12, 40),
            AutoSize = true,
            ForeColor = Color.DimGray,
        };

        var lbl = new Label { Text = "Папка с игрой:", Location = new Point(12, 75), AutoSize = true };
        _pathBox = new TextBox { Location = new Point(12, 95), Width = 540, ReadOnly = false };
        var btnBrowse = new Button { Text = "Обзор…", Location = new Point(560, 94), Width = 60, Height = 23 };
        var btnAutoDetect = new Button { Text = "Найти", Location = new Point(624, 94), Width = 60, Height = 23 };

        _status = new Label
        {
            Location = new Point(12, 125),
            AutoSize = true,
            Font = new Font(Font, FontStyle.Italic),
            ForeColor = Color.DarkBlue,
            Text = "…",
        };

        _btnSetup = NewActionButton("Установить MelonLoader + мод", 12, 155, 250);
        _btnUpdateDll = NewActionButton("Обновить DLL мода", 270, 155, 180);
        _btnLaunchSteam = NewActionButton("Запустить через Steam", 12, 190, 200);
        _btnLaunchDirect = NewActionButton("Запустить напрямую", 220, 190, 180);
        _btnOpenMods = NewActionButton("Открыть Mods/", 410, 190, 130);
        _btnUninstall = NewActionButton("Удалить MelonLoader+мод", 12, 225, 250);

        _progress = new ProgressBar { Location = new Point(12, 260), Width = 680, Height = 14, Style = ProgressBarStyle.Continuous };

        _logBox = new TextBox
        {
            Location = new Point(12, 285),
            Width = 680,
            Height = 220,
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = Color.Black,
            ForeColor = Color.Lime,
            Font = new Font("Consolas", 9f),
        };

        Controls.AddRange(new Control[] {
            header, sub, lbl, _pathBox, btnBrowse, btnAutoDetect, _status,
            _btnSetup, _btnUpdateDll, _btnLaunchSteam, _btnLaunchDirect, _btnOpenMods, _btnUninstall,
            _progress, _logBox,
        });

        btnBrowse.Click += (_, _) => BrowseForGame();
        btnAutoDetect.Click += (_, _) => AutoDetect();
        _pathBox.TextChanged += (_, _) => { _gameDir = _pathBox.Text; RefreshStatus(); };
        _btnSetup.Click += async (_, _) => await SetupAsync();
        _btnUpdateDll.Click += (_, _) => UpdateDllOnly();
        _btnLaunchSteam.Click += (_, _) => GameLauncher.LaunchViaSteam(Log);
        _btnLaunchDirect.Click += (_, _) => { if (_gameDir != null) GameLauncher.LaunchDirect(_gameDir, Log); };
        _btnOpenMods.Click += (_, _) => OpenMods();
        _btnUninstall.Click += (_, _) => Uninstall();

        Log("Трейнер запущен. Автоматически ищу игру…");
        AutoDetect();
    }

    private Button NewActionButton(string text, int x, int y, int w) =>
        new Button { Text = text, Location = new Point(x, y), Width = w, Height = 28 };

    private void BrowseForGame()
    {
        using var fbd = new FolderBrowserDialog { Description = "Выбери папку Schoolboy Runaway" };
        if (fbd.ShowDialog(this) == DialogResult.OK)
        {
            _pathBox.Text = fbd.SelectedPath;
            _gameDir = fbd.SelectedPath;
            RefreshStatus();
        }
    }

    private void AutoDetect()
    {
        try
        {
            var dir = SteamFinder.FindGameDirectory();
            if (dir != null)
            {
                _pathBox.Text = dir;
                _gameDir = dir;
                Log($"Нашёл игру: {dir}");
            }
            else Log("Не нашёл Schoolboy Runaway в Steam-библиотеках. Укажи папку вручную (Обзор).");
        }
        catch (Exception ex) { Log($"Авто-поиск упал: {ex.Message}"); }
        RefreshStatus();
    }

    private void RefreshStatus()
    {
        if (string.IsNullOrEmpty(_gameDir) || !Directory.Exists(_gameDir))
        {
            _status.Text = "Папка игры не выбрана.";
            _status.ForeColor = Color.DarkRed;
            SetInteractable(false);
            return;
        }
        var ml = MelonLoaderInstaller.IsInstalled(_gameDir);
        var modPath = Path.Combine(_gameDir, "Mods", ModInstaller.ModDllName);
        var modInstalled = File.Exists(modPath);

        _status.Text = $"MelonLoader: {(ml ? "OK" : "нет")}   |   Мод DLL: {(modInstalled ? "OK" : "нет")}";
        _status.ForeColor = (ml && modInstalled) ? Color.DarkGreen : Color.DarkOrange;
        SetInteractable(true);
    }

    private void SetInteractable(bool on)
    {
        _btnSetup.Enabled = on;
        _btnUpdateDll.Enabled = on;
        _btnLaunchSteam.Enabled = true; // always allowed
        _btnLaunchDirect.Enabled = on;
        _btnOpenMods.Enabled = on;
        _btnUninstall.Enabled = on;
    }

    private async Task SetupAsync()
    {
        if (_gameDir == null) return;
        SetInteractable(false);
        _progress.Style = ProgressBarStyle.Marquee;
        try
        {
            await MelonLoaderInstaller.InstallAsync(_gameDir, Log);
            CopyModDll();
            Log("Готово. Нажми «Запустить через Steam».");
        }
        catch (Exception ex) { Log($"Ошибка установки: {ex.Message}"); }
        finally
        {
            _progress.Style = ProgressBarStyle.Continuous;
            SetInteractable(true);
            RefreshStatus();
        }
    }

    private void UpdateDllOnly()
    {
        if (_gameDir == null) return;
        try { CopyModDll(); Log("DLL мода обновлён."); }
        catch (Exception ex) { Log($"Ошибка обновления DLL: {ex.Message}"); }
        RefreshStatus();
    }

    private void CopyModDll()
    {
        if (_gameDir == null) return;
        var src = ModInstaller.FindLocalModDll();
        if (src == null)
        {
            Log("Не нашёл SchoolboyRunawayCheats.dll рядом с trainer.exe. Положи его в ту же папку.");
            return;
        }
        ModInstaller.Install(_gameDir, src, Log);
    }

    private void OpenMods()
    {
        if (_gameDir == null) return;
        var mods = Path.Combine(_gameDir, "Mods");
        Directory.CreateDirectory(mods);
        try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(mods) { UseShellExecute = true }); }
        catch (Exception ex) { Log($"Не смог открыть {mods}: {ex.Message}"); }
    }

    private void Uninstall()
    {
        if (_gameDir == null) return;
        if (MessageBox.Show(this,
                "Удалить MelonLoader и мод из папки игры?\nЭто сотрёт: version.dll, dobby.dll, MelonLoader/, Mods/, Plugins/, UserLibs/, UserData/",
                "Подтверждение", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes)
            return;

        ModInstaller.Uninstall(_gameDir, Log);
        MelonLoaderInstaller.Uninstall(_gameDir, Log);
        RefreshStatus();
    }

    private void Log(string msg)
    {
        if (InvokeRequired) { BeginInvoke(new Action<string>(Log), msg); return; }
        _logBox.AppendText($"[{DateTime.Now:HH:mm:ss}] {msg}{Environment.NewLine}");
    }
}
