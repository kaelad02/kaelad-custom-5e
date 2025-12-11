export function init() {
  Hooks.on("renderCharacterActorSheet", (app, html, context) => {
    if (!context.editable) return;
    const actor = app.actor;
    const spellcastingCards = html.querySelectorAll(".spellcasting.card");
    const allClasses = [...Object.values(actor.classes), ...Object.values(actor.subclasses)];
    const searchRegex = new RegExp(game.i18n.translations.DND5E.SpellcastingClass.replace("{class}", "(.+)"));
    for (const card of spellcastingCards) {
      const containerEl = document.createElement("div");
      containerEl.classList.add("spellcasting-card-container");
      card.insertAdjacentElement("beforebegin", containerEl);
      containerEl.insertAdjacentElement("afterbegin", card);
      const className = searchRegex.exec(card.querySelector("h3")?.textContent ?? "")[1];
      const identifier = allClasses.find(i => i.name === className)?.identifier;
      if (!identifier) continue;
      const template = document.createElement("template");
      template.innerHTML = `
      <button type="button" class="open-compendium-browser" data-identifier="${identifier}">
        <i class="fa-solid fa-book-open-reader" inert></i>
        Show ${className} Spells
      </button>
      `.trim();
      const button = containerEl.insertAdjacentElement("beforeend", template.content.children[0]);
      button.addEventListener("click", () => {
        const cbFilters = {};
        if (identifier in actor.classes) {
          cbFilters.spelllist = {[`class:${identifier}`]: 1};
          const subclassIdentifier = actor.classes[identifier].subclass?.identifier;
          if (subclassIdentifier) cbFilters.spelllist[`subclass:${subclassIdentifier}`] = 1;
        } else cbFilters.spellList = {[`subclass:${identifier}`]: 1};
        const spellcasting = (actor.classes[identifier] ?? actor.subclasses[identifier]).system.spellcasting;
        const spellcastingConfig = CONFIG.DND5E.spellcasting[spellcasting.type];
        const spellcastingProgression = CONFIG.DND5E.spellProgression[spellcasting.progression];
        const equivalentLevel = spellcastingProgression.roundUp
          ? Math.ceil(spellcasting.levels / spellcastingProgression.divisor)
          : Math.floor(spellcasting.levels / spellcastingProgression.divisor);
        const maxSlot = spellcastingConfig.table[equivalentLevel - 1].length;
        cbFilters.level = {max: maxSlot};
        new dnd5e.applications.CompendiumBrowser({
          tab: "spells",
          filters: {
            initial: {
              additional: cbFilters
            }
          }
        }).render({force: true});
      });
    }
  });

  /*const el = document.createElement("style");
  el.id = "kaelad-spell-buttons-style";
  el.innerText = `
    .dnd5e2.sheet.actor .spellcasting-card-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  `;
  document.head.appendChild(el);*/
}
