using System.Linq;
using UnityEngine;

namespace SchoolboyRunawayCheats
{
    /// <summary>
    /// Finds the player GameObject heuristically. After you provide the real class name in
    /// GameBindings.PlayerTypeName it will prefer that.
    /// </summary>
    public static class PlayerLocator
    {
        public static GameObject Player { get; private set; }
        public static CharacterController CharController { get; private set; }
        public static Rigidbody Body { get; private set; }
        public static Camera Cam { get; private set; }

        private static float _nextScan;

        public static void Refresh()
        {
            if (Player != null && Cam != null && Time.unscaledTime < _nextScan) return;
            _nextScan = Time.unscaledTime + 1.5f;

            Cam = Camera.main != null ? Camera.main : Object.FindObjectOfType<Camera>();

            // 1. Try bound class name first
            if (!string.IsNullOrEmpty(GameBindings.PlayerTypeName))
            {
                var type = System.AppDomain.CurrentDomain.GetAssemblies()
                    .SelectMany(a => { try { return a.GetTypes(); } catch { return new System.Type[0]; } })
                    .FirstOrDefault(t => t.FullName == GameBindings.PlayerTypeName || t.Name == GameBindings.PlayerTypeName);
                if (type != null && typeof(Component).IsAssignableFrom(type))
                {
                    var comp = Object.FindObjectOfType(type) as Component;
                    if (comp != null) { Player = comp.gameObject; }
                }
            }

            // 2. Fallback: tag "Player"
            if (Player == null)
            {
                try { Player = GameObject.FindGameObjectWithTag("Player"); } catch { /* tag may not exist */ }
            }

            // 3. Fallback: the object owning Camera.main's parent chain + a CharacterController / Rigidbody
            if (Player == null && Cam != null)
            {
                var t = Cam.transform;
                while (t != null)
                {
                    if (t.GetComponent<CharacterController>() != null || t.GetComponent<Rigidbody>() != null)
                    { Player = t.gameObject; break; }
                    t = t.parent;
                }
            }

            // 4. Last resort: any CharacterController in scene
            if (Player == null)
            {
                var cc = Object.FindObjectOfType<CharacterController>();
                if (cc != null) Player = cc.gameObject;
            }

            if (Player != null)
            {
                CharController = Player.GetComponent<CharacterController>();
                Body = Player.GetComponent<Rigidbody>();
            }
        }
    }
}
