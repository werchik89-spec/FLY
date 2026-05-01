using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

namespace SchoolboyRunawayCheats
{
    public static class FreezeNpcs
    {
        private struct FrozenNpc
        {
            public MonoBehaviour Behaviour;
            public bool WasEnabled;
        }

        private static readonly List<FrozenNpc> _frozen = new();
        private static bool _active;
        private static float _nextScan;

        public static void Tick()
        {
            if (_active && Time.unscaledTime >= _nextScan)
            {
                _nextScan = Time.unscaledTime + 2f;
                FreezeAll();
            }
        }

        public static void Enable()
        {
            _active = true;
            _nextScan = 0;
        }

        public static void Disable()
        {
            _active = false;
            Restore();
        }

        private static void FreezeAll()
        {
            foreach (var mb in Object.FindObjectsOfType<MonoBehaviour>())
            {
                if (mb == null) continue;
                var go = mb.gameObject;
                if (go == PlayerLocator.Player) continue;

                var tn = mb.GetType().Name.ToLowerInvariant();
                bool isNpc = tn.Contains("npc") || tn.Contains("enemy") || tn.Contains("ai") ||
                             tn.Contains("teacher") || tn.Contains("guard") || tn.Contains("bully") ||
                             tn.Contains("patrol") || tn.Contains("chase");
                if (!isNpc) continue;

                if (mb.enabled)
                {
                    _frozen.Add(new FrozenNpc { Behaviour = mb, WasEnabled = true });
                    mb.enabled = false;
                }

                var agent = go.GetComponent<NavMeshAgent>();
                if (agent != null && agent.enabled)
                {
                    agent.isStopped = true;
                    agent.velocity = Vector3.zero;
                }

                var rb = go.GetComponent<Rigidbody>();
                if (rb != null)
                {
                    rb.velocity = Vector3.zero;
                    rb.angularVelocity = Vector3.zero;
                    rb.isKinematic = true;
                }

                var animator = go.GetComponent<Animator>();
                if (animator != null) animator.speed = 0f;
            }
        }

        public static void Restore()
        {
            foreach (var f in _frozen)
            {
                if (f.Behaviour != null) f.Behaviour.enabled = f.WasEnabled;
            }
            _frozen.Clear();

            foreach (var agent in Object.FindObjectsOfType<NavMeshAgent>())
            {
                if (agent != null && agent.enabled) agent.isStopped = false;
            }
            foreach (var animator in Object.FindObjectsOfType<Animator>())
            {
                if (animator != null && animator.gameObject != PlayerLocator.Player) animator.speed = 1f;
            }
        }
    }
}
