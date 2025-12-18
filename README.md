# Kaelad's Kustomizations

This Foundry VTT module adds some customizations to the dnd5e system.

## Automatically Mark Defeated

When an actor drops to 0 HP, toggle the Dead or Unconscious status depending on whether they make death saves or not.

## Blind Player Checks

Force ability checks, saves, skills, and tool rolls by players to be blind rolls. Useful if you want players to make a roll but not know the outcome. It's not exposed in the settings, but a macro can toggle it on/off.

```js
game.modules.get("kaelad-custom-5e").api.toggleBps();
```

## Player Macro Folders

When players create macros, automatically add them to a folder with their name on it to help keep the macros organized.

## Class Spell Buttons

Add a button below the classes in the Spells tab to open the Compendium Browser, pre-filtered for that class and level.

_Note:_ This is a client setting that each player can enable for themselves.

## Optional Bonuses

Add checkboxes to the roll config dialogs for optional bonuses (e.g. Sneak Attack and Savage Attacker).

## Customize Token HUD

Show the names of status effects in the Token HUD.

_Note:_ This is a client setting that each player can enable for themselves.

## Group Initiative

Whether to group unlinked tokens in the combat tracker.

- Default: the system's default behavior that groups unlinked tokens if they rolled the same initiative
- Do Not Group: do not group any unlinked tokens
- Group Same Actor: group unlinked tokens of the same actor, only rolling initiative once for the group
