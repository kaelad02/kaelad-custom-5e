/*
 * Automatically trigger the damage roll if the attack hits. Copied from `AttackActivity #rollDamage`
 */

export function init() {
  Hooks.on("dnd5e.postRollAttack", (rolls, data) => {
    //console.log("dnd5e.postRollAttack called", rolls, data);
    if (rolls[0].isSuccess) {
      // get original Activity message
      const attackMessage = rolls[0].parent;
      const messageId = attackMessage.getFlag("dnd5e", "originatingMessage");
      // simulate a click on the Activity message's Damage button
      const activityMessage = document.querySelector(`#chat li[data-message-id="${messageId}"]`);
      activityMessage?.querySelector('button[data-action="rollDamage"]')?.click();
    }
  });
}