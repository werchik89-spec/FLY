using MelonLoader;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class Teleport
    {
        private static Vector3? _saved;
        private static Quaternion? _savedRot;

        public static void SavePosition()
        {
            var p = PlayerLocator.Player;
            if (p == null) { MelonLogger.Msg("Teleport: no player found"); return; }
            _saved = p.transform.position;
            _savedRot = p.transform.rotation;
            MelonLogger.Msg($"Teleport: saved position {_saved}");
        }

        public static void LoadPosition()
        {
            var p = PlayerLocator.Player;
            if (p == null || _saved == null) { MelonLogger.Msg("Teleport: nothing to load"); return; }

            var cc = PlayerLocator.CharController;
            var rb = PlayerLocator.Body;
            bool ccWas = false, rbKin = false;
            if (cc != null) { ccWas = cc.enabled; cc.enabled = false; }
            if (rb != null) { rbKin = rb.isKinematic; rb.isKinematic = true; }

            p.transform.position = _saved.Value;
            if (_savedRot.HasValue) p.transform.rotation = _savedRot.Value;

            if (cc != null) cc.enabled = ccWas;
            if (rb != null) { rb.isKinematic = rbKin; rb.velocity = Vector3.zero; }

            MelonLogger.Msg($"Teleport: loaded {_saved}");
        }
    }
}
