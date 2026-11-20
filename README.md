# BlackSoul Gmod Theme

A dark, GitHub-style theme for Garry's Mod. One drop-in addon restyles the main menu, server browser, addon manager, map selection and the Derma spawn menu. Based on [JWalkerMailly/Derma-Github-Theme](https://github.com/JWalkerMailly/Derma-Github-Theme).

![Main menu](menu_example.jpg)

## Features

- GitHub dark palette in the menu and Derma panels
- Loads from the addons folder, so game updates and Steam file verification don't wipe it
- Server browser matches the current in-game one: infinite scroll, double-click to join, country flags, version tags, favorites by IP
- Addon manager with preset import/export, multi-select enable/disable and dependency warnings
- Navbar gear: UI scale (75–135%), an optional "apply theme to all gamemodes", and a problems-counter toggle

## Installation

1. Close Garry's Mod.
2. Copy this folder into `.../Steam/steamapps/common/GarrysMod/garrysmod/addons/`.
3. Start the game.

If an older version was installed by copying files into `garrysmod/html`, run Steam's "Verify integrity of game files" once to restore the originals. The addon overrides them anyway.

## Usage

The gear sits in the bottom-right of the main menu:

- UI Scale — minus / current value (click to reset) / plus, 75–135%.
- Apply theme to all gamemodes — off by default, takes effect on the next game load.
- Hide the problems counter — hides the badge; the problems button still opens the panel.

Settings persist between sessions.

## Credits

- Base project: [JWalkerMailly/Derma-Github-Theme](https://github.com/JWalkerMailly/Derma-Github-Theme)
- Menu icons: [Octicons](https://primer.style/foundations/icons) by GitHub
