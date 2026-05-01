using System.Collections.Generic;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class Invisible
    {
        private static readonly List<RendererState> _saved = new();
        private static bool _applied;

        public static void Enable()
        {
            if (_applied) return;
            var p = PlayerLocator.Player;
            if (p == null) return;

            _saved.Clear();
            foreach (var r in p.GetComponentsInChildren<Renderer>(true))
            {
                if (r == null) continue;
                _saved.Add(new RendererState { Renderer = r, WasEnabled = r.enabled });
                r.enabled = false;
            }

            DisableDetection(p);
            _applied = true;
        }

        public static void Disable()
        {
            if (!_applied) return;
            foreach (var s in _saved)
            {
                if (s.Renderer != null) s.Renderer.enabled = s.WasEnabled;
            }
            _saved.Clear();
            _applied = false;
        }

        private static void DisableDetection(GameObject player)
        {
            foreach (var mb in Object.FindObjectsOfType<MonoBehaviour>())
            {
                if (mb == null || mb.gameObject == player) continue;
                var tn = mb.GetType().Name.ToLowerInvariant();
                if (!tn.Contains("detect") && !tn.Contains("vision") && !tn.Contains("sight") &&
                    !tn.Contains("awareness") && !tn.Contains("search")) continue;

                var flags = System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
                foreach (var f in mb.GetType().GetFields(flags))
                {
                    var fn = f.Name.ToLowerInvariant();
                    if ((fn.Contains("range") || fn.Contains("radius") || fn.Contains("distance")) &&
                        (f.FieldType == typeof(float) || f.FieldType == typeof(double)))
                    {
                        try { f.SetValue(mb, System.Convert.ChangeType(0f, f.FieldType)); } catch { }
                    }
                }
            }
        }

        private struct RendererState
        {
            public Renderer Renderer;
            public bool WasEnabled;
        }
    }
}
