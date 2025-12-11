import * as defeated from "./modules/defeated.js";
import * as blindPlayerChecks from "./modules/blind-player-checks.js";
import * as folderMacros from "./modules/folder-macros.js";

Hooks.once("init", () => {
  log("initializing...");

  game.modules.get("kaelad-custom-5e").api = {};

  defeated.init();
  blindPlayerChecks.init();
  folderMacros.init();
});

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
