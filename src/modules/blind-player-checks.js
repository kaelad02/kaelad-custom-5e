/**
 * Blind Player Checks
 */

export function init() {
  game.settings.register("kaelad-custom-5e", "blindPlayerChecks", {
    name: "Blind Player Checks",
    hint: "Force ability checks, saves, skills, and tool rolls by players to be blind rolls.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  // add function to toggle setting
  game.modules.get("kaelad-custom-5e").api.toggle = async () => {
    const blind = !game.settings.get("kaelad-custom-5e", "blindPlayerChecks");
    await game.settings.set("kaelad-custom-5e", "blindPlayerChecks", blind);
    if (blind) ui.notifications.warn("Player checks are now blind");
    else ui.notifications.info("Player checks are now normal");
  };

  // register hooks for ability checks and saves
  const hookFn = (config, dialog, message) => {
    if (!game.user.isGM && game.settings.get("kaelad-custom-5e", "blindPlayerChecks"))
      message.rollMode = CONST.DICE_ROLL_MODES.BLIND;
  };
  Hooks.on("dnd5e.preRollAbilityCheckV2", hookFn);
  Hooks.on("dnd5e.preRollAbilitySaveV2", hookFn);
}
