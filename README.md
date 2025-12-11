# Kaelad's Kustomizations

This Foundry VTT module adds some customizations to the dnd5e system.

## Automatically Mark Defeated

When an actor drops to 0 HP, toggle the Dead or Unconscious status depending on whether they make death saves or not.

## Blind Player Checks

There is a hidden setting that forces any ability check or save by players to be blind rolls. Useful if you want players to make a roll but not know the outcome. It's not exposed in the settings, but a macro can toggle it on/off.

```js
game.modules.get("kaelad-custom-5e").api.toggle();
```

## Auto Folder Macros

When players create macros, automatically add them to a folder with their name on it to help keep the macros organized.
