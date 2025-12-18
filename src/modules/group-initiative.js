export function init() {
  const origGroupingKey = dnd5e.documents.Combatant5e.prototype.getGroupingKey;
  dnd5e.documents.Combatant5e.prototype.getGroupingKey = function () {
    const setting = game.settings.get("kaelad-custom-5e", "groupInitiative");
    // default behavior
    if (setting === "default")
      return origGroupingKey.bind(this).apply();
    // do not group
    if (setting === "none")
      return null;
    // group same actor
    if (setting === "actor") {
      if ( this.group ) return this.group.id;
      if ( this.token?.actorLink || !this.token?.baseActor ) return null;
      return `${this.token.disposition}:${this.token.baseActor.id}`;
    }
  };

  const semaphore = new foundry.utils.Semaphore(1);
  Hooks.on("createCombatant", (document, options, userId) => {
    if (!game.user.isActiveGM) return;
    const setting = game.settings.get("kaelad-custom-5e", "groupInitiative");
    if (setting === "actor") {
      semaphore.add(groupCombatant, document);
    }
  });
}

function groupCombatant(combatant) {
  return new Promise(async resolve => {
    // already has a group, don't touch
    if (combatant.group) resolve(false);
    // not an unlinked token
    else if (combatant.token?.actorLink || !combatant.token?.baseActor) resolve(false);
    else {
      const key = `${combatant.token.disposition}:${combatant.token.baseActor.id}`;
      const combat = combatant.combat;
      // check if a group already exists
      const group = combat.groups.find(g => g.getFlag("kaelad-custom-5e", "key") === key);
      if (group) {
        resolve(
          combatant.update({group: group.id})
        );
      } else {
        // see if there's another combatant to group with
        const otherCombatant = combat.combatants.find(c => c.getGroupingKey() === key && c.id !== combatant.id);
        if (otherCombatant) {
          // create a new group then add the two combatants to it
          const [group] = await combat.createEmbeddedDocuments("CombatantGroup", [{"flags.kaelad-custom-5e.key": key}]);
          resolve(
            combat.updateEmbeddedDocuments("Combatant", [
              {_id: combatant.id, group: group.id},
              {_id: otherCombatant.id, group: group.id}
            ])
          );
        } else {
          resolve(false);
        }
      }
    }
  });
}
