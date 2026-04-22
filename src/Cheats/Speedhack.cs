using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class Speedhack
    {
        private static float _baseTimeScale = 1f;
        private static bool _captured;
        private static float _applied = -1f;

        public static void Tick(CheatState s)
        {
            if (!_captured)
            {
                _baseTimeScale = Time.timeScale <= 0.01f ? 1f : Time.timeScale;
                _captured = true;
            }
            var want = _baseTimeScale * s.SpeedMultiplier;
            if (Mathf.Abs(_applied - want) > 0.001f)
            {
                Time.timeScale = want;
                _applied = want;
            }
        }

        public static void Restore()
        {
            if (_captured) { Time.timeScale = _baseTimeScale; _captured = false; _applied = -1f; }
        }
    }
}
