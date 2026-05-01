using System;
using System.Linq;
using System.Reflection;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class SuperJump
    {
        private static float _origJumpForce = -1f;
        private static bool _captured;

        public static void Tick(CheatState s)
        {
            var p = PlayerLocator.Player;
            if (p == null) return;

            if (!_captured)
            {
                CaptureOriginal(p);
                _captured = true;
            }

            ApplyMultiplier(p, s.JumpMultiplier);

            if (Input.GetKeyDown(KeyCode.Space))
            {
                var rb = PlayerLocator.Body;
                var cc = PlayerLocator.CharController;
                bool grounded = (cc != null && cc.isGrounded) || IsGroundedRaycast(p.transform);

                if (grounded && rb != null)
                {
                    rb.AddForce(Vector3.up * s.JumpMultiplier * 5f, ForceMode.Impulse);
                }
            }
        }

        private static bool IsGroundedRaycast(Transform t)
        {
            return Physics.Raycast(t.position + Vector3.up * 0.1f, Vector3.down, 0.3f);
        }

        private static void CaptureOriginal(GameObject p)
        {
            var flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;
            foreach (var c in p.GetComponentsInChildren<Component>(true))
            {
                if (c == null) continue;
                foreach (var f in c.GetType().GetFields(flags))
                {
                    var lower = f.Name.ToLowerInvariant();
                    if ((lower.Contains("jump") && (lower.Contains("force") || lower.Contains("height") || lower.Contains("power") || lower.Contains("speed")))
                        && (f.FieldType == typeof(float) || f.FieldType == typeof(int)))
                    {
                        try
                        {
                            _origJumpForce = Convert.ToSingle(f.GetValue(c));
                            return;
                        }
                        catch { }
                    }
                }
            }
        }

        private static void ApplyMultiplier(GameObject p, float multiplier)
        {
            var flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;
            foreach (var c in p.GetComponentsInChildren<Component>(true))
            {
                if (c == null) continue;
                foreach (var f in c.GetType().GetFields(flags))
                {
                    var lower = f.Name.ToLowerInvariant();
                    if ((lower.Contains("jump") && (lower.Contains("force") || lower.Contains("height") || lower.Contains("power") || lower.Contains("speed")))
                        && (f.FieldType == typeof(float) || f.FieldType == typeof(int)))
                    {
                        try
                        {
                            float baseVal = _origJumpForce > 0 ? _origJumpForce : Convert.ToSingle(f.GetValue(c));
                            f.SetValue(c, Convert.ChangeType(baseVal * multiplier, f.FieldType));
                        }
                        catch { }
                    }
                }
            }
        }

        public static void Restore()
        {
            _captured = false;
            _origJumpForce = -1f;
        }
    }
}
