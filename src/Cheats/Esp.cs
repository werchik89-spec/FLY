using System.Collections.Generic;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class Esp
    {
        private static readonly Color NpcColor = Color.red;
        private static readonly Color PickupColor = Color.green;
        private static readonly Color DoorColor = Color.yellow;

        private static GUIStyle _labelStyle;
        private static readonly List<EspTarget> _targets = new();
        private static float _nextScan;

        public static void Scan()
        {
            if (Time.unscaledTime < _nextScan) return;
            _nextScan = Time.unscaledTime + 1f;

            _targets.Clear();

            foreach (var mb in Object.FindObjectsOfType<MonoBehaviour>())
            {
                if (mb == null) continue;
                var tn = mb.GetType().Name.ToLowerInvariant();
                var go = mb.gameObject;

                if (tn.Contains("npc") || tn.Contains("enemy") || tn.Contains("ai") ||
                    tn.Contains("teacher") || tn.Contains("guard") || tn.Contains("bully") ||
                    tn.Contains("character") && go != PlayerLocator.Player)
                {
                    if (go == PlayerLocator.Player) continue;
                    _targets.Add(new EspTarget(go, NpcColor, "NPC"));
                }
                else if (tn.Contains("pickup") || tn.Contains("item") || tn.Contains("gift") ||
                         tn.Contains("collect") || tn.Contains("key"))
                {
                    _targets.Add(new EspTarget(go, PickupColor, "Item"));
                }
                else if (tn.Contains("door") || tn.Contains("lock") || tn.Contains("gate"))
                {
                    _targets.Add(new EspTarget(go, DoorColor, "Door"));
                }
            }
        }

        public static void DrawGUI()
        {
            if (_labelStyle == null)
            {
                _labelStyle = new GUIStyle(GUI.skin.label)
                {
                    fontSize = 12,
                    fontStyle = FontStyle.Bold,
                    alignment = TextAnchor.MiddleCenter
                };
            }

            var cam = PlayerLocator.Cam;
            if (cam == null) return;
            var playerPos = PlayerLocator.Player != null ? PlayerLocator.Player.transform.position : cam.transform.position;

            foreach (var t in _targets)
            {
                if (t.Go == null) continue;
                var worldPos = t.Go.transform.position + Vector3.up * 1.5f;
                var viewportPos = cam.WorldToViewportPoint(worldPos);
                if (viewportPos.z < 0) continue;

                var screenPos = cam.WorldToScreenPoint(worldPos);
                screenPos.y = Screen.height - screenPos.y;

                float dist = Vector3.Distance(playerPos, t.Go.transform.position);
                if (dist > 200f) continue;

                var boxColor = t.Color;
                boxColor.a = Mathf.Clamp01(1f - dist / 200f);

                var label = $"{t.Label}\n{t.Go.name}\n[{dist:F0}m]";
                _labelStyle.normal.textColor = boxColor;

                var content = new GUIContent(label);
                var size = _labelStyle.CalcSize(content);
                var rect = new Rect(screenPos.x - size.x / 2, screenPos.y - size.y / 2, size.x, size.y);

                DrawOutlinedLabel(rect, label, _labelStyle, Color.black, boxColor);
            }
        }

        private static void DrawOutlinedLabel(Rect r, string text, GUIStyle style, Color outline, Color main)
        {
            style.normal.textColor = outline;
            GUI.Label(new Rect(r.x - 1, r.y, r.width, r.height), text, style);
            GUI.Label(new Rect(r.x + 1, r.y, r.width, r.height), text, style);
            GUI.Label(new Rect(r.x, r.y - 1, r.width, r.height), text, style);
            GUI.Label(new Rect(r.x, r.y + 1, r.width, r.height), text, style);
            style.normal.textColor = main;
            GUI.Label(r, text, style);
        }

        private struct EspTarget
        {
            public GameObject Go;
            public Color Color;
            public string Label;

            public EspTarget(GameObject go, Color color, string label)
            {
                Go = go;
                Color = color;
                Label = label;
            }
        }
    }
}
