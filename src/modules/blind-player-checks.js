/**
 * Blind Player Checks
 */

export function init() {
  // register setting and get current value
  game.settings.register("kaelad-custom-5e", "blindPlayerChecks", {
    name: "Blind Player Checks",
    hint: "Force ability checks, saves, skills, and tool rolls by players to be blind rolls.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onchange: (value) => (_blindPlayerChecks = value),
  });
  let _blindPlayerChecks = game.settings.get("kaelad-custom-5e", "blindPlayerChecks");

  // register hooks for Ability, Skill, and Tool checks
  const hookFn = (_, config) => {
    if (!game.user.isGM && _blindPlayerChecks) config.rollMode = CONST.DICE_ROLL_MODES.BLIND;
  };
  Hooks.on("dnd5e.preRollAbilityTest", hookFn);
  Hooks.on("dnd5e.preRollAbilitySave", hookFn);
  Hooks.on("dnd5e.preRollSkill", hookFn);
  Hooks.on("dnd5e.preRollToolCheck", hookFn);
}
