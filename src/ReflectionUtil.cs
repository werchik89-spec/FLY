using System;
using System.Linq;
using System.Reflection;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    internal static class ReflectionUtil
    {
        private const BindingFlags All =
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static;

        public static Type FindType(string nameOrFullName)
        {
            if (string.IsNullOrEmpty(nameOrFullName)) return null;
            foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
            {
                Type[] types;
                try { types = asm.GetTypes(); }
                catch (ReflectionTypeLoadException rtle) { types = rtle.Types.Where(t => t != null).ToArray(); }
                catch { continue; }

                var match = types.FirstOrDefault(t =>
                    t != null &&
                    (t.FullName == nameOrFullName || t.Name == nameOrFullName));
                if (match != null) return match;
            }
            return null;
        }

        public static bool TrySet(Component comp, string member, object value)
        {
            if (comp == null || string.IsNullOrEmpty(member)) return false;
            var t = comp.GetType();
            var f = t.GetField(member, All);
            if (f != null) { try { f.SetValue(comp, ConvertTo(value, f.FieldType)); return true; } catch { } }
            var p = t.GetProperty(member, All);
            if (p != null && p.CanWrite) { try { p.SetValue(comp, ConvertTo(value, p.PropertyType)); return true; } catch { } }
            return false;
        }

        public static object TryGet(Component comp, string member)
        {
            if (comp == null || string.IsNullOrEmpty(member)) return null;
            var t = comp.GetType();
            var f = t.GetField(member, All);
            if (f != null) { try { return f.GetValue(comp); } catch { } }
            var p = t.GetProperty(member, All);
            if (p != null && p.CanRead) { try { return p.GetValue(comp); } catch { } }
            return null;
        }

        public static bool TryInvoke(Component comp, string method, params object[] args)
        {
            if (comp == null || string.IsNullOrEmpty(method)) return false;
            var t = comp.GetType();
            var mi = t.GetMethods(All).FirstOrDefault(m => m.Name == method && m.GetParameters().Length == args.Length);
            if (mi == null) return false;
            try { mi.Invoke(comp, args); return true; } catch { return false; }
        }

        private static object ConvertTo(object v, Type target)
        {
            if (v == null) return null;
            if (target.IsInstanceOfType(v)) return v;
            try { return Convert.ChangeType(v, target); } catch { return v; }
        }
    }
}
