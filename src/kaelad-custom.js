Hooks.once("init", () => {
  log("initializing...");

  Hooks.on("updateActor", wounded);

  preventPlayerIdentifying();

  blindPlayerChecks();
});

Hooks.once("setup", async () => {
  await userMacroFolders();
});

/**
 * Wounded indicators
 */

async function wounded(actor, update, options, userId) {
  // only run hook on the user that updated the actor
  if (userId !== game.user.id) return;

  // only run hook if HP was changed (any of them)
  if (getProperty(update, "system.attributes.hp") === undefined) return;

  debug("actor HP updated, checking for wounded/dead states");
  const hp = actor.system.attributes.hp;

  // Bloodied
  if (!actor.hasPlayerOwner) {
    const isBloodied = 0 < hp.value && hp.value <= (hp.max + hp.tempmax) / 2;
    await toggleEffect(actor, "bleeding", isBloodied);
  }

  if (actor.type === "character") {
    // Unconscious
    const isUnconscious = hp.value === 0;
    await toggleEffect(actor, "unconscious", isUnconscious);
  } else {
    // Dead
    const isDead = hp.value === 0;
    await toggleEffect(actor, "dead", isDead, true);
  }
}

async function toggleEffect(actor, effectId, active, overlay = false) {
  debug("toggling effect", effectId, active);

  // adapted from EffectsElement#_onToggleCondition
  const existing = actor.effects.get(dnd5e.utils.staticID(`dnd5e${effectId}`));
  if (existing && !active) return existing.delete();
  else if (!existing && active) {
    const effect = await ActiveEffect.implementation.fromStatusEffect(effectId);
    if (overlay) effect.updateSource({ "flags.core.overlay": true });
    return ActiveEffect.implementation.create(effect, { parent: actor, keepId: true });
  }
}

/**
 * Fixes https://github.com/foundryvtt/dnd5e/issues/2781
 */

function preventPlayerIdentifying() {
  // Prevent players from updating
  Hooks.on("preUpdateItem", (item, update) => {
    if (!game.user.isGM && "identified" in (update.system ?? {})) return false;
  });

  // Remove Identify button at top of Item Sheet
  Hooks.on("renderItemSheet", (sheet, [html]) => {
    if (game.user.isGM || sheet.item.system.identified) return;
    html
      .querySelectorAll(".dnd5e.sheet.item .sheet-header .item-subtitle label:has(input:not([disabled]))")
      .forEach((n) => n.remove());
  });

  // Remove Identify button from Item Context menu on Actor Sheet
  Hooks.on("dnd5e.getItemContextOptions", (item, buttons) => {
    if (game.user.isGM || item.system.identified) return;
    buttons.findSplice((e) => e.name === "DND5E.Identify");
  });
}

/**
 * Blind Player Checks
 */

function blindPlayerChecks() {
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

/**
 * User Macro Folders
 */

async function userMacroFolders() {
  if (game.users.activeGM.isSelf) {
    // create folders for each user
    for (const user of game.users) {
      if (!foundry.utils.hasProperty(user, "flags.kaelad-custom-5e.macroFolderId")) await _createMacroFolder(user);
    }
    // use Hook for new users
    Hooks.on("createUser", async (user) => {
      await _createMacroFolder(user);
    });
  }

  Hooks.on("preCreateMacro", (macro, data) => {
    if (!data.folder) {
      const folder = foundry.utils.getProperty(game.user, "flags.kaelad-custom-5e.macroFolderId");
      macro.updateSource({ folder });
    }
  });
}

async function _createMacroFolder(user) {
  const folder = await Folder.implementation.create({
    folder: null,
    name: user.name,
    sorting: "a",
    type: "Macro",
  });
  await user.setFlag("kaelad-custom-5e", "macroFolderId", folder.id);
}

/**
 * Utility functions
 */

function debugEnabled() {
  // TODO
  return true;
}

function debug(...args) {
  try {
    if (debugEnabled()) log(...args);
  } catch (e) {}
}

function log(...args) {
  console.log("Kaelad's Kustomizations |", ...args);
}
