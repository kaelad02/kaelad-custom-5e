import * as defeated from "./modules/defeated.js";
import * as blindPlayerChecks from "./modules/blind-player-checks.js";
import * as folderMacros from "./modules/folder-macros.js";
import * as classSpellButtons from "./modules/class-spell-buttons.js";
import * as masteries from "./modules/masteries.js";
import * as optionalBonuses from "./modules/optional-bonuses.js";
import * as tokenHud from "./modules/token-hud.js";
import * as damageTypeAppearance from "./modules/damage-type-appearance.js";

Hooks.once("init", () => {
  console.log("Kaelad's Kustomizations initializing...");

  game.modules.get("kaelad-custom-5e").api = {};

  const settings = {
    defeated: {
      config: {
        name: "Automatically Mark Defeated",
        hint: "When an actor drops to 0 HP, toggle the Dead or Unconscious status depending on whether they make death saves or not.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
      },
      initClass: defeated
    },
    blindPlayerChecks: {
      config: {
        name: "Blind Player Checks",
        hint: "Force ability checks, saves, skills, and tool rolls by players to be blind rolls.",
        scope: "world",
        config: false,
        requiresReload: false,
        type: Boolean,
        default: false,
      },
      initClass: blindPlayerChecks
    },
    folderMacros: {
      config: {
        name: "Player Macro Folders",
        hint: "When players create macros, automatically add them to a folder with their name on it to help keep the macros organized.",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
      },
      initClass: folderMacros
    },
    classSpellButtons: {
      config: {
        name: "Class Spell Buttons",
        hint: "Add a button below the classes in the Spells tab to open the Compendium Browser, pre-filtered for that class and level.",
        scope: "client",
        config: true,
        requiresReload: false,
        type: Boolean,
        default: false,
      },
      initClass: classSpellButtons
    },
    optionalBonuses: {
      config: {
        name: "Optional Bonuses",
        hint: "Add checkboxes to the roll config dialogs for optional bonuses (e.g. Sneak Attack and Savage Attacker).",
        scope: "world",
        config: true,
        requiresReload: true,
        type: Boolean,
        default: false,
      },
      initClass: optionalBonuses
    },
    tokenHud: {
      config: {
        name: "Customize Token HUD",
        hint: "Show the names of status effects in the Token HUD.",
        scope: "client",
        config: true,
        requiresReload: false,
        type: Boolean,
        default: false,
      },
      initClass: tokenHud
    },
    damageTypeAppearance: {
      config: {
        name: "Damage Type Appearance",
        hint: "Changes the appearance of damage dice based on the damage type (e.g. fire damage is red).",
        scope: "client",
        config: true,
        requiresReload: false,
        type: Boolean,
        default: false,
      },
      initClass: damageTypeAppearance
    }
  };

  for (const [key, setting] of Object.entries(settings)) {
    game.settings.register("kaelad-custom-5e", key, setting.config);
    if (!setting.config.requiresReload || game.settings.get("kaelad-custom-5e", key)) setting.initClass.init();
  }
});
