import { Approach } from './Models.js';
import * as Constants from './Constants.js';

export class EditApproach extends FormApplication {
    constructor(approach) {
        super(approach);
        this.approach = approach;
        if (this.approach == undefined) {
            this.approach = new Approach().toObject();
        }
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/fate-hybrid-skills/templates/EditApproach.hbs";
        options.width = "1000";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-hybrid-skills.applications.editApproach.title")} ${game.world.title}`;
        options.closeOnSubmit = true;
        options.id = "EditApproach";
        options.resizable = true;
        return options;
    }

    async getData() {
        let rich = {};
        let approach = foundry.utils.duplicate(this.approach);
        for (let part in approach) {
            if (part != "name" && part != "pc") {
                rich[part] = await fcoConstants.fcoEnrich(approach[part]);
            }
        }

        const templateData = {
            approach: this.approach,
            rich: rich,
        }

        return templateData;
    }


    activateListeners(html) {
        super.activateListeners(html);
        const saveButton = html.find("button[id='edit_save_changes']");
        saveButton.on("click", () => this.submit());
        fcoConstants.getPen("edit_approach_description");
        fcoConstants.getPen("edit_approach_overcome");
        fcoConstants.getPen("edit_approach_caa");
        fcoConstants.getPen("edit_approach_attack");
        fcoConstants.getPen("edit_approach_defend");

        this.setupRichEditor(html, 'description');
        this.setupRichEditor(html, 'overcome');
        this.setupRichEditor(html, 'caa');
        this.setupRichEditor(html, 'attack');
        this.setupRichEditor(html, 'defend');
    }

    setupRichEditor(html, field) {
        const field_rich = html.find(`#edit_approach_${field}_rich`);
        field_rich.on('keyup', event => {
            if (event.which == 9) field_rich.trigger('click');
        });
        field_rich.on('click', event => {
            $(`#edit_approach_${field}_rich`).css('display', 'none');
            $(`#edit_approach_${field}`).css('display', 'block');
            $(`#edit_approach_${field}`).focus();
        });
        field_rich.on('contextmenu', async event => {
            let text = await fcoConstants.updateText(`Edit raw HTML`, event.currentTarget.innerHTML, true);
            if (text != 'discarded') {
                $('#edit_approach_${field}_rich')[0].innerHTML = text;    
                $('#edit_approach_${field}')[0].innerHTML = text;    
            }
        });

        const approach_field = html.find(`div[id='edit_approach_${field}']`);
        approach_field.on('blur', async event => {
            if (!window.getSelection().toString()) {
                let desc;
                if (foundry.utils.isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                    $(`#edit_approach_${field}_rich`)[0].innerHTML = desc;     
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));
                }
                
                $(`#edit_approach_${field}`).css('display', 'none');
                $(`#edit_approach_${field}_rich`)[0].innerHTML = desc;    
                $(`#edit_approach_${field}_rich`).css('display', 'block');
            }
        });
    }

    async _updateObject(event, approach) {
        let approaches = game.settings.get(Constants.MODULE_ID, "approaches");
        let newApproach = new Approach({
            "name": approach.name,
            "description": approach.description,
            "overcome": approach.overcome,
            "caa": approach.caa,
            "attack": approach.attack,
            "defend": approach.defend,
            "pc": approach.pc
        }).toJSON();
        if (approach.name === undefined || approach.name == "") {
            Uint16Array.notifications.error(game.i18n.localize("fate-hybrid-skills.applications.editApproach.noBlankNames"));
            return;
        }

        let existing = false;
        let key = fcoConstants.gkfn(approaches, approach.name);
        if (approaches[key] != undefined) {
            approaches[key] = newApproach
            existing = true;
        }

        if (!existing) {
            if (this.approach.name != "") {
                // This means the name has been changed. Delete the original approach and replace it with this one.
                delete approaches[fcoConstants.gkfn(approaches, this.approach.name)];
            }
            approaches[fcoConstants.tob64(approach.name)] = newApproach;
        }
        await game.settings.set(Constants.MODULE_ID, "approaches", approaches);
        if (this.setupWindow != undefined) {
            await this.setupWindow.render(false);
        }
    }
}