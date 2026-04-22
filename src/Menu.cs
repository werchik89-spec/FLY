using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public class Menu
    {
        private readonly CheatState _s;
        private Rect _rect = new Rect(20, 20, 320, 380);
        private Vector2 _scroll;

        public Menu(CheatState state) { _s = state; }

        public void Draw()
        {
            _rect = GUI.Window(0xDE71, _rect, DrawWindow, "Schoolboy Runaway Cheats  [Insert]");
        }

        private void DrawWindow(int id)
        {
            _scroll = GUILayout.BeginScrollView(_scroll);

            _s.Fly              = GUILayout.Toggle(_s.Fly,              "Fly  [F1]");
            _s.Noclip           = GUILayout.Toggle(_s.Noclip,           "Noclip  [F2]");
            _s.InfiniteStamina  = GUILayout.Toggle(_s.InfiniteStamina,  "Infinite Stamina  [F3]");
            _s.Speedhack        = GUILayout.Toggle(_s.Speedhack,        "Speedhack  [F4]");
            _s.Esp              = GUILayout.Toggle(_s.Esp,              "ESP (WIP)");

            GUILayout.Space(6);
            GUILayout.Label($"Fly / Noclip speed: {_s.FlySpeed:F1}");
            _s.FlySpeed = GUILayout.HorizontalSlider(_s.FlySpeed, 1f, 40f);
            _s.NoclipSpeed = _s.FlySpeed;

            GUILayout.Label($"Speed multiplier: {_s.SpeedMultiplier:F2}x");
            _s.SpeedMultiplier = GUILayout.HorizontalSlider(_s.SpeedMultiplier, 0.5f, 8f);

            GUILayout.Space(6);
            GUILayout.Label("Teleport");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Save pos  [F5]")) Teleport.SavePosition();
            if (GUILayout.Button("Load pos  [F6]")) Teleport.LoadPosition();
            GUILayout.EndHorizontal();

            GUILayout.Space(6);
            GUILayout.Label("Actions");
            if (GUILayout.Button("Unlock all doors (scene scan)")) UnlockDoors.Run();
            if (GUILayout.Button("Collect all pickups (scene scan)")) CollectPickups.Run();

            GUILayout.Space(8);
            var p = PlayerLocator.Player;
            GUILayout.Label(p != null
                ? $"Player: {p.name}  @ {p.transform.position}"
                : "Player: <not found — move around once>");

            GUILayout.EndScrollView();
            GUI.DragWindow(new Rect(0, 0, 10000, 20));
        }
    }
}
