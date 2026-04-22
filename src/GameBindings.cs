namespace SchoolboyRunawayCheats
{
    /// <summary>
    /// Fill these in after dumping the game's assemblies with Cpp2IL / Il2CppDumper.
    /// All cheats have heuristic fallbacks if these stay empty, but filling them in
    /// makes everything more reliable.
    ///
    /// How to dump (IL2CPP):
    ///   1. Install MelonLoader (auto installs Il2CppInterop)
    ///   2. Run the game once — MelonLoader writes proxy DLLs to
    ///      `Schoolboy Runaway\MelonLoader\Il2CppAssemblyGenerator\Il2CppInteropOutput\`
    ///   3. Open `Assembly-CSharp.dll` (or the likely gameplay one) in dnSpy / ILSpy
    ///   4. Find the player/stamina/door classes and paste FullName values below
    ///
    /// How to dump (Mono):
    ///   1. Open `Schoolboy Runaway_Data\Managed\Assembly-CSharp.dll` in dnSpy
    /// </summary>
    public static class GameBindings
    {
        /// <summary>FullName or short Name of the player component class. e.g. "Player" or "Game.PlayerController".</summary>
        public const string PlayerTypeName = "";

        /// <summary>Field or property name on the player that holds stamina / energy.</summary>
        public const string StaminaMemberName = "stamina";

        /// <summary>Field or property name on the player that holds max stamina.</summary>
        public const string MaxStaminaMemberName = "maxStamina";

        /// <summary>FullName or short Name of the door class (used by Unlock all doors).</summary>
        public const string DoorTypeName = "";

        /// <summary>Field/property that marks a door as locked.</summary>
        public const string DoorLockedMemberName = "isLocked";

        /// <summary>FullName or short Name of the pickup / item class (used by Collect all).</summary>
        public const string PickupTypeName = "";

        /// <summary>Method name to invoke on each pickup to collect it (no args, or single-arg with player).</summary>
        public const string PickupCollectMethodName = "Pickup";
    }
}
