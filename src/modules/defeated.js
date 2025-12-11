/**
 * Wounded indicators
 */

export function init() {
  Hooks.on("updateActor", wounded);
}

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
    if (overlay) effect.updateSource({"flags.core.overlay": true});
    return ActiveEffect.implementation.create(effect, {parent: actor, keepId: true});
  }
}
