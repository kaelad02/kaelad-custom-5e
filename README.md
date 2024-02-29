# Kaelad's Kustomizations

This Foundry VTT module adds some customizations to the dnd5e system.

## Automatically Mark Defeated

Automatically apply the Bleeding condition when a GM-owned token is at or below half their hit points. Apply the Dead condition when they reach zero hit points and Unconscious if they're a PC.

## Bug Fix for Players Identifying Items

There's currently a bug in the dnd5e system that allows players to identify items on their character sheet. This hides the Identify toggle on the sheet and cancels any attempt to update the item from a macro for players.

## Blind Player Checks

There is a hidden setting that forces any ability check, save, skill, and tool roll by players to be blind rolls. Useful if you want players to make a roll but not know the outcome. It's not exposed in the settings, but a macro can toggle it on/off.

```js
const blind = !game.settings.get("kaelad-custom-5e", "blindPlayerChecks");
await game.settings.set("kaelad-custom-5e", "blindPlayerChecks", blind);
if (blind) ui.notifications.warn("Player checks are now blind");
else ui.notifications.info("Player checks are now normal");
```
