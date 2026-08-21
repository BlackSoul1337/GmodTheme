if SERVER then
	AddCSLuaFile("skins/blacksoul_github.lua")
	return
end

-- Persisted as a cookie by the menu HTML (the menu state runs no addon Lua,
-- but cookies are shared between states). The convar mirrors it so the skin
-- and console can read it in the client realm.
if (!GetConVar("blacksoul_theme_all_gamemodes")) then
	CreateClientConVar("blacksoul_theme_all_gamemodes", "0", false, false, "Apply the BlackSoul Derma theme to Helix and other excluded gamemodes.")
end

RunConsoleCommand("blacksoul_theme_all_gamemodes", cookie.GetString("blacksoul_theme_all_gamemodes", "0"))

-- The legacy standalone Derma package registers its hooks when its skin loads,
-- which happens after this autorun. Remove them again once everything is loaded.
local function RemoveLegacyGithubTheme()
	hook.Remove("ForceDermaSkin", "Derma.Github.Override")
	hook.Remove("SpawnMenuCreated", "Derma.Github.Fonts")
end

RemoveLegacyGithubTheme()
timer.Simple(0, RemoveLegacyGithubTheme)
hook.Add("InitPostEntity", "BlackSoul.RemoveLegacyGithubTheme", RemoveLegacyGithubTheme)

include("skins/blacksoul_github.lua")
