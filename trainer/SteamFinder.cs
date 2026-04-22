using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace SchoolboyRunawayTrainer;

/// <summary>Locates the Schoolboy Runaway install directory by scanning Steam library folders.</summary>
[SupportedOSPlatform("windows")]
public static class SteamFinder
{
    public const string AppId = "3359320";
    public const string ExpectedFolderName = "SchoolBoy Runaway";

    public static string? FindGameDirectory()
    {
        foreach (var lib in EnumerateSteamLibraries())
        {
            var commonDir = Path.Combine(lib, "steamapps", "common");
            if (!Directory.Exists(commonDir)) continue;

            // First try exact-ish name
            foreach (var d in Directory.EnumerateDirectories(commonDir))
            {
                var name = Path.GetFileName(d);
                if (name.Replace(" ", "").Equals("schoolboyrunaway", StringComparison.OrdinalIgnoreCase))
                    return d;
            }

            // Fall back: look for appmanifest_3359320.acf
            var manifest = Path.Combine(lib, "steamapps", $"appmanifest_{AppId}.acf");
            if (File.Exists(manifest))
            {
                var installDir = ReadAcfValue(manifest, "installdir");
                if (!string.IsNullOrEmpty(installDir))
                {
                    var path = Path.Combine(commonDir, installDir);
                    if (Directory.Exists(path)) return path;
                }
            }
        }
        return null;
    }

    public static IEnumerable<string> EnumerateSteamLibraries()
    {
        var steam = GetSteamInstallPath();
        if (string.IsNullOrEmpty(steam)) yield break;

        // Main library is the Steam install itself
        if (Directory.Exists(Path.Combine(steam, "steamapps"))) yield return steam;

        // Additional libraries listed in libraryfolders.vdf
        var vdf = Path.Combine(steam, "steamapps", "libraryfolders.vdf");
        if (!File.Exists(vdf)) yield break;

        var text = File.ReadAllText(vdf);
        foreach (Match m in Regex.Matches(text, "\"path\"\\s+\"([^\"]+)\"", RegexOptions.IgnoreCase))
        {
            var path = m.Groups[1].Value.Replace("\\\\", "\\");
            if (Directory.Exists(path)) yield return path;
        }
    }

    public static string? GetSteamInstallPath()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return null;
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\WOW6432Node\Valve\Steam")
                         ?? Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Valve\Steam");
            var path = key?.GetValue("InstallPath") as string;
            if (!string.IsNullOrEmpty(path) && Directory.Exists(path)) return path;
        }
        catch { /* registry not available */ }

        using var cu = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Valve\Steam");
        var cuPath = cu?.GetValue("SteamPath") as string;
        if (!string.IsNullOrEmpty(cuPath) && Directory.Exists(cuPath)) return cuPath;

        return null;
    }

    private static string? ReadAcfValue(string path, string key)
    {
        foreach (var line in File.ReadLines(path))
        {
            var m = Regex.Match(line, "\"" + Regex.Escape(key) + "\"\\s+\"([^\"]+)\"", RegexOptions.IgnoreCase);
            if (m.Success) return m.Groups[1].Value;
        }
        return null;
    }
}
