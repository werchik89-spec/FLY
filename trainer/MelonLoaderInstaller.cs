using System;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace SchoolboyRunawayTrainer;

public static class MelonLoaderInstaller
{
    public const string Version = "0.6.6";
    public const string ZipUrl =
        "https://github.com/LavaGang/MelonLoader/releases/download/v" + Version + "/MelonLoader.x64.zip";

    public static bool IsInstalled(string gameDir) =>
        File.Exists(Path.Combine(gameDir, "version.dll")) &&
        Directory.Exists(Path.Combine(gameDir, "MelonLoader"));

    public static async Task InstallAsync(string gameDir, Action<string> log, CancellationToken ct = default)
    {
        if (IsInstalled(gameDir))
        {
            log("MelonLoader уже установлен.");
            return;
        }

        var tmp = Path.Combine(Path.GetTempPath(), $"melonloader_{Guid.NewGuid():N}");
        Directory.CreateDirectory(tmp);
        var zip = Path.Combine(tmp, "ml.zip");

        try
        {
            log($"Скачиваю MelonLoader v{Version}...");
            using (var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) })
            await using (var src = await http.GetStreamAsync(ZipUrl, ct).ConfigureAwait(false))
            await using (var dst = File.Create(zip))
            {
                await src.CopyToAsync(dst, ct).ConfigureAwait(false);
            }

            log("Распаковываю в папку игры...");
            ZipFile.ExtractToDirectory(zip, gameDir, overwriteFiles: true);
            log("MelonLoader установлен.");
        }
        finally
        {
            try { Directory.Delete(tmp, recursive: true); } catch { /* best effort */ }
        }
    }

    public static void Uninstall(string gameDir, Action<string> log)
    {
        string[] targets =
        {
            Path.Combine(gameDir, "version.dll"),
            Path.Combine(gameDir, "MelonLoader"),
            Path.Combine(gameDir, "Mods"),
            Path.Combine(gameDir, "Plugins"),
            Path.Combine(gameDir, "UserLibs"),
            Path.Combine(gameDir, "UserData"),
            Path.Combine(gameDir, "dobby.dll"),
        };
        foreach (var t in targets)
        {
            try
            {
                if (File.Exists(t)) { File.Delete(t); log($"  - удалён файл: {Path.GetFileName(t)}"); }
                else if (Directory.Exists(t)) { Directory.Delete(t, recursive: true); log($"  - удалена папка: {Path.GetFileName(t)}"); }
            }
            catch (Exception ex) { log($"  ! не смог удалить {t}: {ex.Message}"); }
        }
    }
}
