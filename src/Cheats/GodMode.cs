using System;
using System.Linq;
using System.Reflection;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class GodMode
    {
        private static readonly string[] HealthNames =
            { "health", "hp", "hitpoints", "life", "lives", "currenthealth", "currenthp" };

        private static readonly string[] DamageMethodNames =
            { "TakeDamage", "ApplyDamage", "Damage", "Hurt", "ReceiveDamage", "OnDamage", "Hit" };

        public static void Tick()
        {
            var p = PlayerLocator.Player;
            if (p == null) return;

            foreach (var c in p.GetComponentsInChildren<Component>(true))
            {
                if (c == null) continue;
                var tn = c.GetType().Name;
                if (tn == "Transform" || tn == "RectTransform") continue;
                TryMaxHealth(c);
            }
        }

        private static void TryMaxHealth(Component c)
        {
            var type = c.GetType();
            var flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;

            foreach (var f in type.GetFields(flags))
            {
                if (!IsNumeric(f.FieldType)) continue;
                var lower = f.Name.ToLowerInvariant();
                if (!HealthNames.Any(h => lower.Contains(h))) continue;

                float maxVal = FindMaxValue(type, f.Name, flags, c);
                try { f.SetValue(c, Convert.ChangeType(maxVal, f.FieldType)); } catch { }
            }

            foreach (var prop in type.GetProperties(flags))
            {
                if (!prop.CanWrite || !IsNumeric(prop.PropertyType)) continue;
                var lower = prop.Name.ToLowerInvariant();
                if (!HealthNames.Any(h => lower.Contains(h))) continue;

                float maxVal = FindMaxValue(type, prop.Name, flags, c);
                try { prop.SetValue(c, Convert.ChangeType(maxVal, prop.PropertyType)); } catch { }
            }
        }

        private static float FindMaxValue(Type type, string healthName, BindingFlags flags, Component c)
        {
            var prefixes = new[] { "max", "Max", "MAX", "total", "Total" };
            foreach (var prefix in prefixes)
            {
                var candidate = prefix + char.ToUpper(healthName[0]) + healthName.Substring(1);
                var f = type.GetField(candidate, flags);
                if (f != null && IsNumeric(f.FieldType))
                {
                    try
                    {
                        var val = Convert.ToSingle(f.GetValue(c));
                        if (val > 0) return val;
                    }
                    catch { }
                }
                var p = type.GetProperty(candidate, flags);
                if (p != null && p.CanRead && IsNumeric(p.PropertyType))
                {
                    try
                    {
                        var val = Convert.ToSingle(p.GetValue(c));
                        if (val > 0) return val;
                    }
                    catch { }
                }
            }
            return 9999f;
        }

        private static bool IsNumeric(Type t) =>
            t == typeof(float) || t == typeof(double) || t == typeof(int);
    }
}
