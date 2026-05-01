using MelonLoader;
using SchoolboyRunawayCheats;
using UnityEngine;

[assembly: MelonInfo(typeof(CheatMod), "Schoolboy Runaway Cheats", "0.1.0", "werchik89-spec")]
[assembly: MelonGame(null, null)] // any game — user installs into Schoolboy Runaway folder

namespace SchoolboyRunawayCheats
{
    public class CheatMod : MelonMod
    {
        public static CheatMod Instance { get; private set; }

        private Menu _menu;
        private readonly CheatState _state = new();

        public override void OnInitializeMelon()
        {
            Instance = this;
            LoggerInstance.Msg("Schoolboy Runaway Cheats loaded. Press Insert to toggle menu.");
            _menu = new Menu(_state);
        }

        public override void OnUpdate()
        {
            try
            {
                if (Input.GetKeyDown(KeyCode.Insert)) _state.MenuOpen = !_state.MenuOpen;
                if (Input.GetKeyDown(KeyCode.F1)) _state.Fly = !_state.Fly;
                if (Input.GetKeyDown(KeyCode.F2)) _state.Noclip = !_state.Noclip;
                if (Input.GetKeyDown(KeyCode.F3)) _state.InfiniteStamina = !_state.InfiniteStamina;
                if (Input.GetKeyDown(KeyCode.F4)) _state.Speedhack = !_state.Speedhack;
                if (Input.GetKeyDown(KeyCode.F5)) Teleport.SavePosition();
                if (Input.GetKeyDown(KeyCode.F6)) Teleport.LoadPosition();
                if (Input.GetKeyDown(KeyCode.F7)) _state.GodMode = !_state.GodMode;
                if (Input.GetKeyDown(KeyCode.F8))
                {
                    _state.FreezeNpcs = !_state.FreezeNpcs;
                    if (_state.FreezeNpcs) FreezeNpcs.Enable();
                    else FreezeNpcs.Disable();
                }
                if (Input.GetKeyDown(KeyCode.F9))
                {
                    _state.InvisibleMode = !_state.InvisibleMode;
                    if (_state.InvisibleMode) Invisible.Enable();
                    else Invisible.Disable();
                }
                if (Input.GetKeyDown(KeyCode.F10)) _state.SuperJump = !_state.SuperJump;

                PlayerLocator.Refresh();

                if (_state.Fly) Fly.Tick(_state);
                if (_state.Noclip) Noclip.Tick(_state);
                if (_state.Speedhack) Speedhack.Tick(_state);
                if (_state.InfiniteStamina) InfiniteStamina.Tick();
                if (_state.GodMode) GodMode.Tick();
                if (_state.FreezeNpcs) FreezeNpcs.Tick();
                if (_state.SuperJump) SuperJump.Tick(_state);
                if (_state.Esp) Esp.Scan();
            }
            catch (System.Exception ex)
            {
                LoggerInstance.Warning($"OnUpdate error: {ex.Message}");
            }
        }

        public override void OnGUI()
        {
            if (_state.MenuOpen) _menu.Draw();
            if (_state.Esp) Esp.DrawGUI();
        }
    }

    public class CheatState
    {
        public bool MenuOpen = true;
        public bool Fly;
        public bool Noclip;
        public bool InfiniteStamina;
        public bool Speedhack;
        public bool GodMode;
        public bool Esp;
        public bool FreezeNpcs;
        public bool InvisibleMode;
        public bool SuperJump;
        public float FlySpeed = 8f;
        public float NoclipSpeed = 8f;
        public float SpeedMultiplier = 2f;
        public float JumpMultiplier = 3f;
    }
}
