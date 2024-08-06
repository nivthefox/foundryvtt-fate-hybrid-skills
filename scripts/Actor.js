import { Approach } from './Models.js';
import * as Constants from './Constants.js';
import { EditPlayerApproaches } from './EditPlayerApproaches.js';
import { fcoActor } from '../../../systems/fate-core-official/scripts/fcoActor.js';

export class Actor extends fcoActor {
    async rollSkill(skillName) {
        const actor = this;

        const skill = fcoConstants.gbn(actor.system.skills, skillName);
        const approach = fcoConstants.gbn(actor.getFlag(Constants.MODULE_ID, 'approaches'), this.selectedApproach);

        if (!approach) {
            ui.notifications.warn(game.i18n.localize("fate-hybrid-skills.applications.sheetApproaches.noApproachSelected"));
            return;
        }

        if (!skill) {
            return
        }

        const roll = new Roll(`4dF + ${approach.rank}[${approach.name}] + ${skill.rank}[${skill.name}]`);
        const fcoc = new fcoConstants();
        const ladder = fcoc.getFateLadder();
        const approachRank = approach.rank.toString();
        const skillRank = skill.rank.toString();
        const approachRung = ladder[approachRank];
        const skillRung = ladder[skillRank];
        const rollResults = await roll.roll();
        rollResults.dice[0].options.sfx = {id:"fate4df", result:rollResults.result};

        let msg = ChatMessage.getSpeaker({actor: actor});
        msg.alias = actor.name;
        const messageData = {actor, game, approach, skill, approachRank, approachRung, skillRank, skillRung};
        rollResults.toMessage({
            flavor: await renderTemplate(`modules/${Constants.MODULE_ID}/templates/RollResults.hbs`, messageData),
            speaker: msg,
        });
    }

    static initialize(populateFromSettings) {
        const approachesList = populateFromSettings ? game.settings.get(Constants.MODULE_ID, "approaches") : {};
        let approaches = {};
        for (let key in approachesList) {
            let approach = foundry.utils.duplicate(approachesList[key]);
            approach.rank = 0;
            approaches[key] = approach;
        }

        let data = {
            flags: {
                'fate-hybrid-skills': {
                    approaches,
                    version: Constants.SCHEMA_VERSION
                }
            }
        };

        return data;
    }

    static async onQuickAddApproach(event, actor) {
        const content = await renderTemplate(`modules/${Constants.MODULE_ID}/templates/QuickAddApproach.hbs`, {});
        new Dialog({
            title: game.i18n.localize("fate-hybrid-skills.applications.quickAddApproach.alt"),
            content,
            buttons: {
                ok: {
                    label: game.i18n.localize("fate-core-official.OK"),
                    callback: async ([html]) => {
                        const name = html.querySelector('#fhs-qa-approach-name').value;
                        const rank = html.querySelector('#fhs-qa-approach-rank').value;
                        if (name !== "") {
                            const newApproach = new Approach({
                                name,
                                description: game.i18n.localize("fate-hybrid-skills.applications.quickAddApproach.description"),
                                pc: false,
                                rank,
                                adhoc: true
                            }).toJSON();
                            const approaches = actor.getFlag(Constants.MODULE_ID, 'approaches');
                            approaches[fcoConstants.tob64(newApproach.name)] = newApproach;
                            await actor.setFlag(Constants.MODULE_ID, 'approaches', approaches);
                        }
                    }
                }
            },
            default: "ok"
        }, {
            width: 400,
            height: 'auto'
        }).render(true);
    }

    static async onEditApproaches(event, actor) {
        const editor = new EditPlayerApproaches(actor);
        editor.render(true);
        editor.setSheet(actor);
        try {
            editor.bringToTop();
        } catch {
            // Do nothing.
        }
    }

    static async onSortApproaches(event, actor, html) {
        actor.sortApproachesByRank = !actor.sortApproachesByRank;
        actor.render(false);
    }
}
