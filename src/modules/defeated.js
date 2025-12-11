/**
 * Mark tokens as defeated
 */

export function init() {
  Hooks.on("dnd5e.damageActor", (actor, changes, update, userId) => {
    if (userId !== game.user.id) return;
    if (actor.system.attributes.hp.value > 0) return;
    if (knockout(actor)) {
      actor.toggleStatusEffect("unconscious", {active: true, overlay: false});
    } else {
      actor.toggleStatusEffect("dead", {active: true, overlay: true});
    }
  });

  Hooks.on("dnd5e.healActor", (actor, changes, update, userId) => {
    if (userId !== game.user.id) return;
    if (actor.system.attributes.hp.value === 0) return;
    if (knockout(actor)) {
      actor.toggleStatusEffect("unconscious", {active: false});
    } else {
      actor.toggleStatusEffect("dead", {active: false});
    }
  });
}

function knockout(actor) {
  let knockout = actor.type === 'character';
  knockout ||= actor.type === "npc" && (!foundry.utils.isEmpty(actor.classes) || actor.system.traits.important);
  return knockout;
}
