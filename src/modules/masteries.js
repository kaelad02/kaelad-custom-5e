export function init() {
  Hooks.on("dnd5e.renderChatMessage", (chatMessage, html) => {
    if (chatMessage.flags?.dnd5e?.activity?.type !== "attack") return;

    // Graze
    if (chatMessage.flags.dnd5e.roll?.mastery === "graze") {
      if (!chatMessage.speakerActor?.isOwner) return;
      // TODO use the D20Roll's isFailure function instead of checking manually
      const attackRoll = chatMessage.rolls[0];
      const ac = chatMessage.flags.dnd5e.targets?.[0]?.ac;
      if (!attackRoll || !ac) return;
      const isMiss = !attackRoll.isCritical && ((attackRoll.total < ac) || attackRoll.isFumble);
      if (!isMiss) return;
      const newDiv = document.createElement("div");
      newDiv.classList.add("dnd5e2", "chat-card", "themed", "theme-light");
      newDiv.innerHTML = `
        <button class="michael-graze" type="button">
          <i class="fa-solid fa-burst" inert></i>
          <span>Graze</span>
        </button>
      `;
      const targetElem = html.querySelector(".message-content .dice-roll");
      if (!targetElem) return;
      targetElem.after(newDiv);
      const button = html.querySelector(".michael-graze");
      if (!button) return;
      return button.addEventListener("click", () => {
        const newFlags = {...chatMessage.flags};
        foundry.utils.setProperty(newFlags, "dnd5e.roll", {type: "damage"});
        delete newFlags.dnd5e.item;
        new dnd5e.dice.DamageRoll("@abilities.str.mod", chatMessage.speakerActor.getRollData()).toMessage({flags: newFlags});
      });
    }
    if (chatMessage.flags.dnd5e.roll?.type !== "damage") return;
    const origItem = chatMessage.getAssociatedItem();
    if (origItem?.type !== "weapon") return;
    const origMessage = chatMessage.getOriginatingMessage();
    const lastAttack = origMessage?.getAssociatedRolls("attack").at(-1);
    const mastery = lastAttack?.rolls[0]?.options?.mastery;
    if (!mastery) return;

    // Topple
    if (mastery === "topple") {
      const newDiv = document.createElement("div");
      newDiv.classList.add("dnd5e2", "chat-card", "themed", "theme-light");
      newDiv.innerHTML = `
        <button class="michael-topple" type="button">
          <i class="fa-solid fa-shield-heart" inert></i>
          <span>Topple</span>
        </button>
      `;
      const targetElem = html.querySelector(".message-content .dice-roll");
      if (!targetElem) return;
      targetElem.after(newDiv);
      const button = html.querySelector(".michael-topple");
      if (!button) return;
      return button.addEventListener("click", async () => {
        const saveDC = 8 + origItem.actor.system.abilities[origItem.abilityMod ?? "str"].mod + origItem.actor.system.attributes.prof;
        const messageContent = `
          <div class="dnd5e2 chat-card request-card">
            <p>
              On fail, become ${await foundry.applications.ux.TextEditor.implementation.enrichHTML("&Reference[prone]")}
            </p>
            <div class="card-buttons">
              <button data-ability="con" data-type="save" data-dc=${saveDC} data-action="rollRequest" data-visibility="all">
                <span class="visible-dc">
                  <i class="fa-solid fa-shield-heart"></i>
                  DC ${saveDC} Constitution
                </span>
                <span class="hidden-dc">
                  <i class="fa-solid fa-shield-heart"></i>
                  Constitution
                </span>
              </button>
            </div>
          </div>
        `;
        const lastTarget = fromUuidSync((foundry.utils.getProperty(lastAttack, "flags.dnd5e.targets") ?? [])[0]?.uuid);
        const speaker = lastTarget ? ChatMessage.implementation.getSpeaker({actor: lastTarget}) : ChatMessage.implementation.getSpeaker(game.user);
        const chatData = {
          user: game.user.id,
          content: messageContent,
          flavor: "Topple!",
          speaker
        }
        ChatMessage.implementation.create(chatData);
      });
    }
  });

  // Sap, Slow, Vex
  Hooks.on("dnd5e.postRollAttack", async (rolls, {subject}) => {
    if (!game.combat) return;
    if (!rolls[0].isSuccess) return;
    const mastery = rolls[0].options.mastery;
    const target = game.user.targets.first();
    if (!target) return;
    switch (mastery) {
      case "sap": {
        if (!game.users.activeGM) return;
        const effectData = {
          name: "Sap (Mastery)",
          img: "icons/skills/toxins/symbol-poison-drop-skull-green.webp",
          duration: {
            rounds: 1
          },
          changes: [{
            key: "flags.automated-conditions-5e.attack.disadvantage",
            mode: 5,
            value: "once"
          }]
        };
        return game.users.activeGM.query("michaelPersonal.createEffects", {actorUuid: target.actor.uuid, effectData: [effectData]});
      }
      case "slow": {
        if (!game.users.activeGM) return;
        const existingEffect = target.actor.effects.getName("Slow (Mastery)");
        if (existingEffect) return game.users.activeGM.query("michaelPersonal.updateEntity", {entityUuid: existingEffect.uuid, update: {
            duration: {
              startRound: game.combat.round,
              startTurn: game.combat.turn ?? 0
            }
          }});
        const effectData = {
          name: "Slow (Mastery)",
          img: "icons/magic/time/hourglass-tilted-gray.webp",
          duration: {
            rounds: 1
          },
          changes: Object.entries(CONFIG.DND5E.movementTypes).map(i => ({key: `system.attributes.movement.${i[0]}`, mode: 2, value: -10}))
        };
        return game.users.activeGM.query("michaelPersonal.createEffects", {actorUuid: target.actor.uuid, effectData: [effectData]});
      }
      case "vex": {
        const effectData = {
          name: `Vex (${target.name})`,
          img: "icons/skills/melee/strike-sword-steel-yellow.webp",
          duration: {
            rounds: 1,
            turns: 1
          },
          changes: [{
            key: "flags.automated-conditions-5e.attack.advantage",
            mode: 5,
            value: `once; targetId === "${target.id}"`
          }]
        };
        return subject.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
      }
    }
  });
}
