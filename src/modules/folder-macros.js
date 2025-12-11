/**
 * Auto Folder Macros
 */

export async function init() {
  Hooks.once("setup", createFolders);
  Hooks.on("preCreateMacro", addToFolder);
}

async function createFolders() {
  let topFolder = game.macros.folders.getName("zzPlayers");
  if (!topFolder) {
    const data = {
      type: "Macro",
      folder: null,
      name: "zzPlayers",
      color: null,
      sorting: "a"
    };
    const created = await Folder.createDocuments([data]);
    topFolder = created[0];
  }

  const playerFolders = [];
  game.users
    .filter((user) => !user.isGM)
    .forEach((user) => {
      const folder = game.macros.folders.getName(user.name);
      if (!folder) playerFolders.push({
        type: "Macro",
        folder: topFolder.id,
        name: user.name,
        color: null,
        sorting: "m"
      });
    });
  if (playerFolders.length > 0) Folder.createDocuments(playerFolders);
}

function addToFolder(macro) {
  if (game.user.isGM) return;
  if (macro.folder) return;

  const folder = game.macros.folders.getName(game.user.name);
  if (folder) macro.updateSource({folder});
}
