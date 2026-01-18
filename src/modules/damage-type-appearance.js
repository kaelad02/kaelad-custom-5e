/*
 * Damage Type Appearance
 * inspired by: https://github.com/foundryvtt/dnd5e/pull/4496/
 */

export function init() {
  const origEvaluate = dnd5e.dice.DamageRoll.prototype.evaluate;
  dnd5e.dice.DamageRoll.prototype.evaluate = async function(options={}) {
    const setting = game.settings.get("kaelad-custom-5e", "damageTypeAppearance");
    if ( setting && this.options.type && !this.options.appearance?.colorset &&
      // workaround for https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/issues/536
      game.dice3d?.exports?.COLORSETS?.[this.options.type] ) {
      foundry.utils.setProperty(this.options, "appearance.colorset", this.options.type);
    }
    return origEvaluate.bind(this).apply(options);
  }
}
