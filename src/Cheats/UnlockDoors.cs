using System.Linq;
using MelonLoader;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class UnlockDoors
    {
        public static void Run()
        {
            int count = 0;

            // 1. Bound door type
            if (!string.IsNullOrEmpty(GameBindings.DoorTypeName))
            {
                var t = ReflectionUtil.FindType(GameBindings.DoorTypeName);
                if (t != null)
                {
                    foreach (var o in Object.FindObjectsOfType(t))
                    {
                        if (o is Component c && ReflectionUtil.TrySet(c, GameBindings.DoorLockedMemberName, false))
                            count++;
                    }
                }
            }

            // 2. Heuristic: any MonoBehaviour whose type-name contains "Door" and has a bool "locked"/"isLocked" field
            foreach (var mb in Object.FindObjectsOfType<MonoBehaviour>())
            {
                if (mb == null) continue;
                var tn = mb.GetType().Name.ToLowerInvariant();
                if (!tn.Contains("door") && !tn.Contains("lock")) continue;
                foreach (var name in new[] { "isLocked", "locked", "IsLocked", "Locked" })
                    if (ReflectionUtil.TrySet(mb, name, false)) { count++; break; }
            }

            MelonLogger.Msg($"UnlockDoors: unlocked {count} objects");
        }
    }
}
