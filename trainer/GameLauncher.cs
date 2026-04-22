using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace SchoolboyRunawayTrainer;

public static class GameLauncher
{
    public static void LaunchViaSteam(Action<string> log)
    {
        try
        {
            var psi = new ProcessStartInfo("steam://rungameid/" + SteamFinder.AppId)
            {
                UseShellExecute = true
            };
            Process.Start(psi);
            log($"Запустил через Steam (appid {SteamFinder.AppId}).");
        }
        catch (Exception ex) { log($"Не смог запустить через Steam: {ex.Message}"); }
    }

    public static void LaunchDirect(string gameDir, Action<string> log)
    {
        var exe = Directory.EnumerateFiles(gameDir, "*.exe", SearchOption.TopDirectoryOnly)
            .FirstOrDefault(f => !Path.GetFileName(f).StartsWith("UnityCrashHandler", StringComparison.OrdinalIgnoreCase));
        if (exe == null) { log("Не нашёл .exe в папке игры."); return; }

        try
        {
            var psi = new ProcessStartInfo(exe) { UseShellExecute = true, WorkingDirectory = gameDir };
            Process.Start(psi);
            log($"Запустил {Path.GetFileName(exe)}.");
        }
        catch (Exception ex) { log($"Не смог запустить: {ex.Message}"); }
    }
}
