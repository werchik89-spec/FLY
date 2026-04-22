using UnityEngine;

namespace SchoolboyRunawayCheats
{
    public static class Fly
    {
        private static bool _wasRbUseGravity;
        private static bool _stateCaptured;

        public static void Tick(CheatState s)
        {
            var p = PlayerLocator.Player;
            var cam = PlayerLocator.Cam;
            if (p == null || cam == null) return;

            CaptureOnce();

            var rb = PlayerLocator.Body;
            if (rb != null)
            {
                rb.useGravity = false;
                rb.velocity = Vector3.zero;
            }
            var cc = PlayerLocator.CharController;

            Vector3 move = Vector3.zero;
            var fwd = cam.transform.forward;
            var right = cam.transform.right;

            if (Input.GetKey(KeyCode.W)) move += fwd;
            if (Input.GetKey(KeyCode.S)) move -= fwd;
            if (Input.GetKey(KeyCode.A)) move -= right;
            if (Input.GetKey(KeyCode.D)) move += right;
            if (Input.GetKey(KeyCode.Space)) move += Vector3.up;
            if (Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.C)) move -= Vector3.up;

            if (move == Vector3.zero) return;
            move = move.normalized * s.FlySpeed * Time.deltaTime * (Input.GetKey(KeyCode.LeftShift) ? 3f : 1f);

            if (cc != null && cc.enabled) cc.Move(move);
            else p.transform.position += move;
        }

        private static void CaptureOnce()
        {
            if (_stateCaptured) return;
            var rb = PlayerLocator.Body;
            if (rb != null) _wasRbUseGravity = rb.useGravity;
            _stateCaptured = true;
        }

        public static void Restore()
        {
            if (!_stateCaptured) return;
            var rb = PlayerLocator.Body;
            if (rb != null) rb.useGravity = _wasRbUseGravity;
            _stateCaptured = false;
        }
    }
}
