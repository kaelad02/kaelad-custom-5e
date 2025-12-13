/**
 * Optional bonuses
 */

export function init() {
  // monkeypatch to make criticals support dice pools (e.g. {2d6, 2d6}kh)
  dnd5e.dice.DamageRoll.prototype.configureDamage = funNewConfigureDamage;

  Hooks.on("dnd5e.buildDamageRollConfig", (dialog, rollConfig, formData, rollIndex) => {
    if (rollIndex > 0) return;

    const opts = formData?.object ?? {};
    if (opts.sneakAttack) rollConfig.parts.push("@scale.rogue.sneak-attack");
    if (opts.dreadfulStrikes) rollConfig.parts.push("@scale.fey.dreadful-strike[psychic]");
    if (opts.savageAttacker) rollConfig.parts[0] = `{${rollConfig.parts[0]}, ${rollConfig.parts[0]}}kh`;
    if (opts.blessedStrikesRadiant) rollConfig.parts.push("@scale.cleric.divine-strike[radiant]");
    if (opts.blessedStrikesNecrotic) rollConfig.parts.push("@scale.cleric.divine-strike[necrotic]");
  });

  Hooks.on("renderDamageRollConfigurationDialog", (app, elements) => {
    const activity = app.config.subject;
    const item = activity?.item;
    const actor = item?.actor;
    if (!actor) return;
    if (elements.querySelector(".optional-bonuses")) return;

    const getIdentifier = (identifier) => actor.items.find(i => i.system.identifier === identifier);
    const fields = [];

    // Sneak Attack
    const sneakAttack = getIdentifier("sneak-attack");
    if (sneakAttack) {
      const ranged = activity.actionType === "rwak" || app.config.attackMode?.includes("thrown");
      const finesse = item.system.properties.has("fin");
      if (ranged || finesse)
        fields.push(
          new foundry.data.fields.BooleanField({label: sneakAttack.name}, {name: "sneakAttack"})
        );
    }

    // Dreadful Strikes
    const dreadfulStrikes = getIdentifier("dreadful-strikes");
    if (dreadfulStrikes && item.type === "weapon")
      fields.push(
        new foundry.data.fields.BooleanField({label: dreadfulStrikes.name}, {name: "dreadfulStrikes"})
      );

    // Savage Attacker
    const savageAttacker = getIdentifier("savage-attacker");
    if (savageAttacker && item.type === "weapon")
      fields.push(
        new foundry.data.fields.BooleanField({label: savageAttacker.name}, {name: "savageAttacker"})
      );

    // Blessed Strikes: Divine Strike
    const blessedStrikes = getIdentifier("blessed-strikes-divine-strike");
    if (blessedStrikes && item.type === "weapon")
      fields.push(
        new foundry.data.fields.BooleanField({label: "Blessed Strikes (Radiant)"}, {name: "blessedStrikesRadiant"}),
        new foundry.data.fields.BooleanField({label: "Blessed Strikes (Necrotic)"}, {name: "blessedStrikesNecrotic"})
      );

    // add new fieldset for the optional bonuses
    if (fields.length) {
      // make new fieldset to hold these
      const newFieldset = document.createElement("fieldset");
      newFieldset.className = "optional-bonuses";
      const legend = document.createElement("legend");
      legend.innerText = "Optional Bonuses";
      newFieldset.append(legend);
      // add fields
      fields.forEach(field => newFieldset.append(field.toFormGroup()));
      // add the new fieldset right before the existing fieldset
      const configFieldset = elements.querySelector('fieldset[data-application-part="configuration"]');
      configFieldset.before(newFieldset);
    }
  });
}

function funNewConfigureDamage({critical = {}} = {}) {
  critical = foundry.utils.mergeObject(critical, this.options.critical ?? {}, {inplace: false});

  // Remove previous critical bonus damage
  this.terms = this.terms.filter(t => !t.options.criticalBonusDamage && !t.options.criticalFlatBonus);

  const flatBonus = new Map();
  for (let [i, term] of this.terms.entries()) {
    // Multiply dice terms
    if (term instanceof foundry.dice.terms.DiceTerm) {
      if (term._number instanceof Roll) {
        // Complex number term.
        if (!term._number.isDeterministic) continue;
        if (!term._number._evaluated) term._number.evaluateSync();
      }
      term.options.baseNumber = term.options.baseNumber ?? term.number; // Reset back
      term.number = term.options.baseNumber;
      if (this.isCritical) {
        let cm = critical.multiplier ?? 2;

        // Powerful critical - maximize damage and reduce the multiplier by 1
        if (critical.powerfulCritical) {
          const bonus = Roll.create(term.formula).evaluateSync({maximize: true}).total;
          if (bonus > 0) {
            const flavor = term.flavor?.toLowerCase().trim() ?? game.i18n.localize("DND5E.PowerfulCritical");
            flatBonus.set(flavor, (flatBonus.get(flavor) ?? 0) + bonus);
          }
          cm = Math.max(1, cm - 1);
        }

        // Alter the damage term
        let cb = (critical.bonusDice && (i === 0)) ? critical.bonusDice : 0;
        term.alter(cm, cb);
        term.options.critical = true;
      }
    } else if (term instanceof foundry.dice.terms.NumericTerm) {
      // Multiply numeric terms
      if (critical.multiplyNumeric) {
        term.options.baseNumber = term.options.baseNumber ?? term.number; // Reset back
        term.number = term.options.baseNumber;
        if (this.isCritical) {
          term.number *= (critical.multiplier ?? 2);
          term.options.critical = true;
        }
      }
    }

    // NEW
    else if (term instanceof foundry.dice.terms.PoolTerm) {
      if (!(term.rolls[0] instanceof dnd5e.dice.DamageRoll)) {
        term.rolls = term.rolls.map(i => new dnd5e.dice.DamageRoll(i.formula, this.data, this.options));
        term.rolls.forEach(i => i.configureDamage({critical}));
        term.terms = term.rolls.map(i => i.formula);
      }
    }
    // END NEW
  }

  // Add powerful critical bonus
  if (critical.powerfulCritical && flatBonus.size) {
    for (const [type, number] of flatBonus.entries()) {
      this.terms.push(new OperatorTerm({operator: "+", options: {criticalFlatBonus: true}}));
      this.terms.push(new NumericTerm({number, options: {flavor: type, criticalFlatBonus: true}}));
    }
  }

  // Add extra critical damage term
  if (this.isCritical && critical.bonusDamage) {
    let extraTerms = new Roll(critical.bonusDamage, this.data).terms;
    if (!(extraTerms[0] instanceof OperatorTerm)) extraTerms.unshift(new OperatorTerm({operator: "+"}));
    extraTerms.forEach(t => t.options.criticalBonusDamage = true);
    this.terms.push(...extraTerms);
  }

  // Re-compile the underlying formula
  this.resetFormula();

  // Mark configuration as complete
  this.options.configured = true;
}
