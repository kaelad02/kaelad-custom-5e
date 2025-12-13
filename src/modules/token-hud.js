export function init() {
  /*const el = document.createElement("style");
  el.id = "michael-custom-hud-style";
  el.innerText = `
    #token-hud .status-effects {
      --effect-size: 48px;

      grid-template-columns: repeat(2, 200px);

      .effect-control {
        display: flex;
        width: auto;
      }

      p {
        margin-left: 5px;
        font-size: x-large;
      }
    }
  `;
  document.head.appendChild(el);*/

  Hooks.on("renderTokenHUD", (app, html) => {
    const statusEffects = html.querySelector(".status-effects");
    statusEffects.classList.toggle("two-columns", true);

    console.log(html);
    html.querySelectorAll('img.effect-control[data-action="effect"]').forEach(el => {
      const newElement = document.createElement("div");
      newElement.classList.add(...el.classList);
      newElement.dataset.action = el.dataset.action;
      newElement.dataset.statusId = el.dataset.statusId;
      let src = el.src;
      if (game.system.id === "dnd5e" && el.dataset.statusId === "exhaustion") {
        const actor = app.object.actor;
        const level = foundry.utils.getProperty(actor, "system.attributes.exhaustion");
        if ( Number.isFinite(level) && (level > 0) ) src = dnd5e.documents.ActiveEffect5e._getExhaustionImage(level);
      }
      newElement.innerHTML = `
        <img src="${src}">
        <p>${el.dataset.tooltipText?.replace("Three-Quarters", "¾")}</p>
      `
      el.replaceWith(newElement);
    });
    if (game.system.id === "dnd5e") {
      html.addEventListener("click", onClickTokenHUD, {capture: true});
      html.addEventListener("contextmenu", onClickTokenHUD, {capture: true});
    }
  });

  // Partial yoink from 5e, changed to work for the modified hud
  const onClickTokenHUD = (event) => {
    const { target: origTarget } = event;
    const target = origTarget?.closest(".effect-control");
    if ( !target?.classList?.contains("effect-control") ) return;

    const actor = canvas.hud.token.object?.actor;
    if ( !actor ) return;

    const id = target.dataset?.statusId;
    if ( id === "exhaustion" ) dnd5e.documents.ActiveEffect5e._manageExhaustion(event, actor);
    else if ( id === "concentrating" ) dnd5e.documents.ActiveEffect5e._manageConcentration(event, actor);
  }
}
