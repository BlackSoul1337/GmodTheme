if SERVER then
	AddCSLuaFile("skins/blacksoul_github.lua")
	return
end

-- Persisted to data/ by the menu HTML (the menu state runs no addon Lua).
-- The convar mirrors it so the skin and console can read it in the client
-- realm; the cookie read below is a legacy fallback for old installs.
if (!GetConVar("blacksoul_theme_all_gamemodes")) then
	CreateClientConVar("blacksoul_theme_all_gamemodes", "0", false, false, "Apply the BlackSoul Derma theme to Helix and other excluded gamemodes.")
end

-- The menu HTML persists the setting to data/ (visible across realms in the
-- same session); the cookie is kept as a legacy fallback.
local themeAllGamemodes = file.Read("blacksoul_theme_all_gamemodes.txt", "DATA") or cookie.GetString("blacksoul_theme_all_gamemodes", "0")

RunConsoleCommand("blacksoul_theme_all_gamemodes", themeAllGamemodes)

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
