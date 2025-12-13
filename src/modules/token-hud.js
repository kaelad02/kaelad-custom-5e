export function init() {
  Hooks.on("renderTokenHUD", (app, html) => {
    if (!game.settings.get("kaelad-custom-5e", "tokenHud")) return;

    // add CSS class
    const statusEffects = html.querySelector(".status-effects");
    statusEffects.classList.toggle("two-columns", true);

    statusEffects.querySelectorAll('img[data-action="effect"]').forEach(element => {
      // create div
      const container = document.createElement("div");
      container.classList.add(...element.classList);
      container.dataset.action = element.dataset.action;
      container.dataset.statusId = element.dataset.statusId;
      // create a new img
      const img = document.createElement("img");
      img.src = element.src;
      if (container.dataset.statusId === "exhaustion") {
        const actor = app.object.actor;
        const level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
        if (Number.isFinite(level) && (level > 0)) img.src = dnd5e.documents.ActiveEffect5e._getExhaustionImage(level);
      }
      container.append(img);
      // create paragraph
      const paragraph = document.createElement("p");
      paragraph.innerText = element.dataset.tooltipText.replace("Three-Quarters", "¾");
      container.append(paragraph);

      element.replaceWith(container);
    });
  });

  // add copy of listener that the dnd5e system has in ActiveEffect5e#onClickTokenHUD
  document.addEventListener("click", onClickTokenHUD, {capture: true});
  document.addEventListener("contextmenu", onClickTokenHUD, {capture: true});
}

function onClickTokenHUD(event) {
  const {target: origTarget} = event;
  const target = origTarget?.closest(".effect-control");
  if (!target?.classList?.contains("effect-control")) return;

  const actor = canvas.hud.token.object?.actor;
  if (!actor) return;

  const id = target.dataset?.statusId;
  if (id === "exhaustion") dnd5e.documents.ActiveEffect5e._manageExhaustion(event, actor);
  else if (id === "concentrating") dnd5e.documents.ActiveEffect5e._manageConcentration(event, actor);
}
