using System.Linq;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class InfiniteStamina
    {
        public static void Tick()
        {
            var p = PlayerLocator.Player;
            if (p == null) return;

            // If user has specified the player type, target the field there.
            if (!string.IsNullOrEmpty(GameBindings.PlayerTypeName))
            {
                var type = ReflectionUtil.FindType(GameBindings.PlayerTypeName);
                if (type != null)
                {
                    var comp = p.GetComponent(type) as Component ?? Object.FindObjectOfType(type) as Component;
                    if (comp != null) { TrySetStamina(comp); return; }
                }
            }

            // Heuristic: any component on player with a field named like "stamina" / "energy" / "run".
            foreach (var c in p.GetComponentsInChildren<Component>(true))
            {
                if (c == null) continue;
                var tn = c.GetType().Name;
                if (tn == "Transform" || tn == "RectTransform") continue;
                TrySetStamina(c);
            }
        }

        private static void TrySetStamina(Component c)
        {
            // Try bound member first
            if (!string.IsNullOrEmpty(GameBindings.StaminaMemberName))
            {
                object max = ReflectionUtil.TryGet(c, GameBindings.MaxStaminaMemberName);
                float maxF = max is float f ? f : (max is int i ? i : 100f);
                ReflectionUtil.TrySet(c, GameBindings.StaminaMemberName, maxF);
            }

            // Heuristic: any numeric field containing "stamina"/"energy" → set to 9999
            var type = c.GetType();
            var flags = System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
            foreach (var f in type.GetFields(flags).Where(ff => IsNumeric(ff.FieldType) && IsStaminaName(ff.Name)))
            {
                try { f.SetValue(c, System.Convert.ChangeType(9999f, f.FieldType)); } catch { }
            }
            foreach (var p in type.GetProperties(flags).Where(pp => pp.CanWrite && IsNumeric(pp.PropertyType) && IsStaminaName(pp.Name)))
            {
                try { p.SetValue(c, System.Convert.ChangeType(9999f, p.PropertyType)); } catch { }
            }
        }

        private static bool IsNumeric(System.Type t) => t == typeof(float) || t == typeof(double) || t == typeof(int);

        private static bool IsStaminaName(string n)
        {
            var l = n.ToLowerInvariant();
            return l.Contains("stamina") || l.Contains("energy") || l.Contains("endurance") || l.Contains("fatigue");
        }
    }
}
