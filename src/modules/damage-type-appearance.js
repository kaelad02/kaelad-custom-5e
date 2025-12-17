export function init() {
  const origEvaluate = dnd5e.dice.DamageRoll.prototype.evaluate;
  dnd5e.dice.DamageRoll.prototype.evaluate = async function(options={}) {
    const setting = game.settings.get("kaelad-custom-5e", "damageTypeAppearance");
    if ( setting && this.options.type && !this.options.appearance?.colorset ) {
      foundry.utils.setProperty(this.options, "appearance.colorset", this.options.type);
    }
    return origEvaluate.bind(this).apply(options);
  }
}
