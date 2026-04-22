using MelonLoader;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class CollectPickups
    {
        public static void Run()
        {
            int count = 0;

            if (!string.IsNullOrEmpty(GameBindings.PickupTypeName))
            {
                var t = ReflectionUtil.FindType(GameBindings.PickupTypeName);
                if (t != null)
                {
                    foreach (var o in Object.FindObjectsOfType(t))
                    {
                        if (o is Component c && ReflectionUtil.TryInvoke(c, GameBindings.PickupCollectMethodName))
                            count++;
                    }
                }
            }
            else
            {
                // Heuristic: any MonoBehaviour containing "Pickup"/"Item"/"Gift" in its type name
                foreach (var mb in Object.FindObjectsOfType<MonoBehaviour>())
                {
                    if (mb == null) continue;
                    var tn = mb.GetType().Name.ToLowerInvariant();
                    if (!tn.Contains("pickup") && !tn.Contains("gift") && !tn.Contains("collect")) continue;

                    foreach (var name in new[] { "Pickup", "Pick", "Collect", "OnPickup", "PickUp" })
                        if (ReflectionUtil.TryInvoke(mb, name)) { count++; break; }
                }
            }

            MelonLogger.Msg($"CollectPickups: triggered {count} pickups");
        }
    }
}
