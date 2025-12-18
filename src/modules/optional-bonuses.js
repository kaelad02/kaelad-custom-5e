/**
 * Optional bonuses
 */

export function init() {
  // monkeypatch to make criticals support dice pools (e.g. {2d6, 2d6}kh)
  dnd5e.dice.DamageRoll.prototype.configureDamage = funNewConfigureDamage;
  // TODO remove when system version updated to 5.2.0
  dnd5e.documents.ChatMessage5e.prototype._simplifyDamageRoll = newSimplifyDamageRoll;

  // look for automatic bonuses earlier, before the buildDamageRollConfig hook
  Hooks.on("dnd5e.preRollDamageV2", (config, dialog, message) => {
    const item = config.subject.item;
    const actor = config.subject.actor;

    const getIdentifier = (identifier) => actor.items.find(i => i.system.identifier === identifier);
    config.autoBonuses = {};

    // Elemental Adept: Fire (by name since it doesn't actually force you to choose which element)
    if (actor.items.getName("Elemental Adept: Fire")) {
      // spells that do fire damage
      if (item.type === "spell" && config.rolls[0].options.type === "fire") {
        config.autoBonuses.elementalAdeptFire = {label: "Elemental Adept: Fire"};
      }
    }

    // Great Weapon Fighting
    const greatWeaponFighting = getIdentifier("great-weapon-fighting");
    if (greatWeaponFighting) {
      // melee weapon with Two-Handed or Versatile property, attacking w/ two hands
      if (item.type === "weapon" &&
        CONFIG.DND5E.weaponTypeMap[item.system.type.value] === "melee" &&
        ["two", "ver"].some(p => item.system.properties.has(p)) &&
        config.attackMode === "twoHanded") {
        config.autoBonuses.greatWeaponFighting = {label: greatWeaponFighting.name};
      }
    }
  });

  Hooks.on("dnd5e.buildDamageRollConfig", (dialog, rollConfig, formData, rollIndex) => {
    if (rollIndex > 0) return;

    const opts = formData?.object ?? {};
    if (dialog.config.autoBonuses.elementalAdeptFire) addDieModifier(rollConfig, "min2");
    if (dialog.config.autoBonuses.greatWeaponFighting) addDieModifier(rollConfig, "min3");
    if (opts.sneakAttack) rollConfig.parts.push("@scale.rogue.sneak-attack");
    if (opts.dreadfulStrikes) rollConfig.parts.push("@scale.fey.dreadful-strike[psychic]");
    if (opts.savageAttacker) rollConfig.parts[0] = `{${rollConfig.parts[0]}, ${rollConfig.parts[0]}}kh`;
    if (opts.greatWeaponMaster) rollConfig.parts.push("@prof");
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

    // Elemental Adept: Fire
    const elementalAdeptFire = app.config.autoBonuses.elementalAdeptFire;
    if (elementalAdeptFire) {
      fields.push(
        new foundry.data.fields.BooleanField({label: elementalAdeptFire.label}, {name: "elementalAdeptFire"})
      );
    }

    // Great Weapon Fighting
    const greatWeaponFighting = app.config.autoBonuses.greatWeaponFighting;
    if (greatWeaponFighting) {
      fields.push(
        new foundry.data.fields.BooleanField({label: greatWeaponFighting.label}, {name: "greatWeaponFighting"})
      );
    }

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

    // Great Weapon Master
    const greatWeaponMaster = getIdentifier("great-weapon-master");
    if (greatWeaponMaster && item.type === "weapon" && item.system.properties.has("hvy"))
      fields.push(
        new foundry.data.fields.BooleanField({label: greatWeaponMaster.name}, {name: "greatWeaponMaster"})
      );

    // Blessed Strikes: Divine Strike
    const blessedStrikes = getIdentifier("blessed-strikes-divine-strike");
    if (blessedStrikes && item.type === "weapon")
      fields.push(
        new foundry.data.fields.BooleanField({label: "Blessed Strikes (Radiant)"}, {name: "blessedStrikesRadiant"}),
        new foundry.data.fields.BooleanField({label: "Blessed Strikes (Necrotic)"}, {name: "blessedStrikesNecrotic"})
      );

    // add new fieldset for the optional bonuses
    addFieldset(fields, elements);
  });

  Hooks.on("dnd5e.buildSkillRollConfig", (dialog, rollConfig, formData, rollIndex) => {
    if (rollIndex > 0) return;

    const opts = formData?.object ?? {};
    if (opts.guidance) rollConfig.parts.push("1d4");
  });

  Hooks.on("renderSkillToolRollConfigurationDialog", (app, elements) => {
    /*const actor = app.config.subject;
    if (!actor) return;*/
    if (elements.querySelector(".optional-bonuses")) return;

    const getIdentifier = (identifier) => actor.items.find(i => i.system.identifier === identifier);
    const fields = [];

    // Guidance
    if (app.config.skill) fields.push(new foundry.data.fields.BooleanField({label: "Guidance"}, {name: "guidance"}));

    // add new fieldset for the optional bonuses
    addFieldset(fields, elements);
  });
}

function addDieModifier(rollConfig, modifier) {
  // only modify the first part
  const roll = new Roll(rollConfig.parts[0], rollConfig.data);
  roll.terms.forEach(term => {
    if (term instanceof foundry.dice.terms.DiceTerm) term.modifiers.push(modifier);
  });
  roll.resetFormula();
  rollConfig.parts[0] = roll.formula;
}

function addFieldset(fields, elements) {
  // fields that are automatic, not optional
  const auto = ["elementalAdeptFire", "greatWeaponFighting"];

  if (fields.length) {
    // make new fieldset to hold these
    const newFieldset = document.createElement("fieldset");
    newFieldset.className = "optional-bonuses";
    const legend = document.createElement("legend");
    legend.innerText = "Optional Bonuses";
    newFieldset.append(legend);
    // add fields
    fields.forEach(field => {
      if (auto.includes(field.name))
        newFieldset.append(field.toFormGroup({}, {disabled: true, value: true}));
      else
        newFieldset.append(field.toFormGroup());
    });
    // add the new fieldset right before the existing fieldset
    const configFieldset = elements.querySelector('fieldset[data-application-part="configuration"]');
    configFieldset.before(newFieldset);
  }
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
      }
      term.rolls.forEach(i => i.configureDamage({critical}));
      term.terms = term.rolls.map(i => i.formula);
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

/*
 * Copied from version 5.2.0 of the system
 */
function newSimplifyDamageRoll(roll) {
  const {OperatorTerm, NumericTerm, DiceTerm, PoolTerm} = foundry.dice.terms;
  const termResultClasses = ["success", "failure", "rerolled", "exploded", "discarded"];
  const aggregate = {
    type: roll.options.type, total: Math.max(0, roll.total), constant: 0, dice: [], icon: null, method: null
  };
  let hasMultiplication = false;
  for (let i = roll.terms.length - 1; i >= 0;) {
    const term = roll.terms[i--];
    if (!(term instanceof NumericTerm) && !(term instanceof DiceTerm) && !(term instanceof PoolTerm)) {
      continue;
    }
    const value = term.total;
    if (term instanceof DiceTerm) {
      const tooltipData = term.getTooltipData();
      aggregate.dice.push(...tooltipData.rolls);
      aggregate.icon ??= tooltipData.icon;
      aggregate.method ??= tooltipData.method;
    }
    if (term instanceof PoolTerm) {
      term.rolls.forEach((poolTermRoll, i) => {
        // Get simplified data for each roll
        const simplified = this._simplifyDamageRoll(poolTermRoll);
        const result = term.results[i];
        // Apply main result classes to individual dice
        simplified.dice.forEach(die => {
          const resultClasses = termResultClasses.filter(c => result[c]).join(" ");
          if (resultClasses.length) die.classes += ` ${resultClasses}`;
        });
        aggregate.dice.push(...simplified.dice);
        aggregate.icon ??= simplified.icon;
        aggregate.method ??= simplified.method;
      });
    }
    let multiplier = 1;
    let operator = roll.terms[i];
    while (operator instanceof OperatorTerm) {
      if (!["+", "-"].includes(operator.operator)) hasMultiplication = true;
      if (operator.operator === "-") multiplier *= -1;
      operator = roll.terms[--i];
    }
    if (term instanceof NumericTerm) aggregate.constant += value * multiplier;
  }
  if (hasMultiplication) aggregate.constant = null;
  return aggregate;
}
