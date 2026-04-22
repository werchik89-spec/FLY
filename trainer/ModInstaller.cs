using System;
using System.IO;
using System.Reflection;

namespace SchoolboyRunawayTrainer;

public static class ModInstaller
{
    public const string ModDllName = "SchoolboyRunawayCheats.dll";

    /// <summary>
    /// Looks for the cheat DLL next to the trainer exe. Returns full path or null.
    /// </summary>
    public static string? FindLocalModDll()
    {
        var baseDir = AppContext.BaseDirectory;
        var candidate = Path.Combine(baseDir, ModDllName);
        if (File.Exists(candidate)) return candidate;

        // When running from bin/Debug during development, also try sibling build output
        var dev = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "src", "bin", "Release", ModDllName));
        if (File.Exists(dev)) return dev;
        dev = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "src", "bin", "Debug", ModDllName));
        if (File.Exists(dev)) return dev;

        return null;
    }

    public static void Install(string gameDir, string modDllPath, Action<string> log)
    {
        var modsDir = Path.Combine(gameDir, "Mods");
        Directory.CreateDirectory(modsDir);

        var dst = Path.Combine(modsDir, ModDllName);
        File.Copy(modDllPath, dst, overwrite: true);
        log($"Скопировал {ModDllName} → {dst}");
    }

    public static void Uninstall(string gameDir, Action<string> log)
    {
        var dst = Path.Combine(gameDir, "Mods", ModDllName);
        try
        {
            if (File.Exists(dst)) { File.Delete(dst); log($"Удалён {ModDllName}"); }
        }
        catch (Exception ex) { log($"Не смог удалить {ModDllName}: {ex.Message}"); }
    }
}
