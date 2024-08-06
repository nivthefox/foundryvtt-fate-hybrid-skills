import {Actor} from './Actor.js';
import * as Constants from './Constants.js';
import * as Log from './Log.js';

Hooks.on('closeEditApproach', );

export async function closeEditApproach() {
    game.system.approachSetup.render(true);
    try {
        game.system.approachSetup.bringToTop();
    } catch  {
        // Do nothing.
    }
}

export async function createActorApproaches(actor, data, options, userid) {
    if ((actor?.flags['fate-hybrid-skills'] === null || actor?.flags['fate-hybrid-skills'] === undefined) &&
        actor.type === "fate-core-official") {
            actor.updateSource(Actor.initialize(true));
    }
}

export async function init() {
    CONFIG.debug.hooks = true;
    CONFIG.debug.sits = true;
    CONFIG.Actor.documentClass = Actor;

    Log.debug("Initialized");
}

export async function renderApproaches(event, [html], data) {
    const approachesLabel = game.settings.get(Constants.MODULE_ID, "approachesLabel") || game.i18n.localize("fate-hybrid-skills.settings.approachesLabel.default");

    if (data.actor.flags['fate-hybrid-skills'] == undefined || 
        data.actor.flags['fate-hybrid-skills'].approaches == null || 
        data.actor.flags['fate-hybrid-skills'].approaches == undefined) {
        data.actor = await data.actor.update(Actor.initialize(false));
    }

    const approaches = data.actor.flags['fate-hybrid-skills'].approaches;
    const approachesByName = fcoConstants.sortByName(approaches);
    const approachesByRank = fcoConstants.sortByRank(approaches);

    data.actor.sortApproachesByRank = (data.actor.sortApproachesByRank !== undefined) 
        ? data.actor.sortApproachesByRank 
        : game.settings.get(Constants.MODULE_ID, "sortApproaches");

    const approachData = {
        ...data,

        approachesByName,
        approachesByRank,
        approachesLabel,
    };
    
    const approachesElement = await renderTemplate(`modules/${Constants.MODULE_ID}/templates/SheetApproaches.hbs`, approachData);
    const skillsElement = html.querySelector('.mfate-panel--skills');
    // skillsElement.insertAdjacentHTML("beforebegin", approachesElement);
    skillsElement.insertAdjacentHTML("beforebegin", '<div class="mfate-panel mfate-panel--skills fate-hybrid-skills-wrapper"></div>');
    skillsElement.remove();
    skillsElement.classList = ['fate-hybrid-skills-panel'];
    const newSkillsElement = html.querySelector('.mfate-panel--skills');
    newSkillsElement.insertAdjacentHTML("afterbegin", approachesElement);
    newSkillsElement.insertAdjacentElement("beforeend", skillsElement);
    
    const addButton = html.querySelector('div[name="quick_add_approach"]');
    if (addButton) {
        addButton.addEventListener('click', (event) => Actor.onQuickAddApproach(event, data.actor));
    }
    
    const editButton = html.querySelector('div[name="edit_player_approaches"]');
    editButton.addEventListener('click', (event) => Actor.onEditApproaches(event, data.actor));
    
    const sortButton = html.querySelector('div[name="sort_player_approaches"]');
    sortButton.addEventListener('click', (event) => Actor.onSortApproaches(event, data.actor, html));

    const approachNames = html.querySelectorAll('.mfate-panel--approaches .mfate-skills-list__skill-name');
    const approachRadios = html.querySelectorAll('.mfate-panel--approaches input[name="selected_approach"]');
    for (let row of approachNames) {
        row.addEventListener('click', event => {
            let name = event.target.value;
            if (event.target.name !== 'selected_approach') {
                name = event.target.id.slice("approach_".length);
            }
            const approach = fcoConstants.gbn(approaches, name);
            approachRadios.forEach(box => box.checked = false);
            const radio = html.querySelector(`.mfate-panel--approaches input[value="${name}"]`);
            radio.checked = true;
            data.actor.selectedApproach = name;
        });
    }
}
