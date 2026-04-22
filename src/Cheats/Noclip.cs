using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class Noclip
    {
        private static Collider[] _cols;
        private static bool[] _wasEnabled;
        private static bool _captured;

        public static void Tick(CheatState s)
        {
            EnsureDisabled();

            var p = PlayerLocator.Player;
            var cam = PlayerLocator.Cam;
            if (p == null || cam == null) return;

            Vector3 move = Vector3.zero;
            if (Input.GetKey(KeyCode.W)) move += cam.transform.forward;
            if (Input.GetKey(KeyCode.S)) move -= cam.transform.forward;
            if (Input.GetKey(KeyCode.A)) move -= cam.transform.right;
            if (Input.GetKey(KeyCode.D)) move += cam.transform.right;
            if (Input.GetKey(KeyCode.Space)) move += Vector3.up;
            if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.C)) move -= Vector3.up;

            if (move == Vector3.zero) return;
            var speed = s.NoclipSpeed * (Input.GetKey(KeyCode.LeftShift) ? 3f : 1f);
            p.transform.position += move.normalized * speed * Time.deltaTime;
        }

        private static void EnsureDisabled()
        {
            var p = PlayerLocator.Player;
            if (p == null) return;
            if (_captured) return;

            _cols = p.GetComponentsInChildren<Collider>(true);
            _wasEnabled = new bool[_cols.Length];
            for (int i = 0; i < _cols.Length; i++)
            {
                _wasEnabled[i] = _cols[i].enabled;
                _cols[i].enabled = false;
            }
            var cc = PlayerLocator.CharController;
            if (cc != null) cc.enabled = false;
            var rb = PlayerLocator.Body;
            if (rb != null) rb.isKinematic = true;
            _captured = true;
        }

        public static void Restore()
        {
            if (!_captured || _cols == null) return;
            for (int i = 0; i < _cols.Length; i++)
                if (_cols[i] != null) _cols[i].enabled = _wasEnabled[i];
            var cc = PlayerLocator.CharController;
            if (cc != null) cc.enabled = true;
            var rb = PlayerLocator.Body;
            if (rb != null) rb.isKinematic = false;
            _captured = false;
            _cols = null;
            _wasEnabled = null;
        }
    }
}
