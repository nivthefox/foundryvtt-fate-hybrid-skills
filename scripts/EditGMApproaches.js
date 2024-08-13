import * as Constants from './Constants.js';
import { Approach } from './Models.js';

export class EditGMApproaches extends FormApplication {
    constructor(actor) {
        super(actor);
        if (this.object.type=="Extra"){ 
            this.options.title=`${game.i18n.localize("fate-hybrid-skills.applications.editGMApproaches.titleForExtra")} ${this.object.name}`                    
        } else {
            if(this.object.isToken){
                this.options.title=`${game.i18n.localize("fate-hybrid-skills.applications.editGMApproaches.titleForToken")} ${this.object.name}`                    
            } else {
                this.options.title=`${game.i18n.localize("fate-hybrid-skills.applications.editGMApproaches.titleFor")} ${this.object.name}`
            }
        }
        this.playerApproaches = foundry.utils.duplicate(this.object.getFlag(Constants.MODULE_ID, "approaches"));
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `modules/${Constants.MODULE_ID}/templates/EditGMApproaches.hbs`; 
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("fate-hybrid-skills.applications.editGMApproaches.title");
        options.closeOnSubmit = false;
        options.id = "GMApproachSetup";
        options.resizable = true;
        return options;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const el = html[0];

        const addAdHoc = el.querySelector('button#add_ah_button');
        addAdHoc.addEventListener('click', event => this.onClickAddAdHoc(event, el));

        const confirm = el.querySelector('button#add_remove_button');
        confirm.addEventListener('click', event => this.onClickConfirm(event, el))

        const checkAll = el.querySelector('button#select_all_approaches_button');
        checkAll.addEventListener('click', event => this.onCheckAll(event, el, true));
        const uncheckAll = el.querySelector('button#deselect_all_approaches_button');
        uncheckAll.addEventListener('click', event => this.onCheckAll(event, el, false));
    }

    async _updateObject(event, [html]) {}

    async getData() {
        this.playerApproaches = foundry.utils.duplicate(this.object.getFlag(Constants.MODULE_ID, "approaches"));
        const worldApproaches = foundry.utils.duplicate(game.settings.get(Constants.MODULE_ID, "approaches"));
        const present = [];
        const absent = [];
        const nonPCWorldApproaches = [];
        const adHoc = [];
        const orphaned = [];

        for (let idx in worldApproaches) {
            const name = worldApproaches[idx].name;
            const approach = fcoConstants.gbn(this.playerApproaches, name);

            if (approach?.extra_id) {
                continue
            }

            if (approach !== undefined) {
                present.push(worldApproaches[idx]);
                continue;
            }

            if (!worldApproaches[idx].pc) {
                nonPCWorldApproaches.push(worldApproaches[idx]);
                continue;
            }

            absent.push(worldApproaches[idx]);
        }

        for (let idx in this.playerApproaches) {
            let approach = this.playerApproaches[idx];
            if (approach.adhoc) {
                adHoc.push(approach);
                continue;
            }

            if (fcoConstants.gbn(worldApproaches, approach.name) == undefined) {
                orphaned.push(approach);
            }
        }

        // sort everything
        if (present.length > 0) {
            fcoConstants.sort_name(present);
        }
        if (absent.length > 0) {
            fcoConstants.sort_name(absent);
        }
        if (nonPCWorldApproaches.length > 0) {
            fcoConstants.sort_name(nonPCWorldApproaches);
        }
        if (adHoc.length > 0) {
            fcoConstants.sort_name(adHoc);
        }
        if (orphaned.length > 0) {
            fcoConstants.sort_name(orphaned);
        }

        const templateData = {
            approachList: worldApproaches,
            characterApproaches: this.playerApproaches,
            presentApproaches: present,
            absentApproaches: absent,
            nonPCWorldApproaches,
            adHocApproaches: adHoc,
            orphaendApproaches: orphaned
        };

        return templateData;
    }

    async onClickAddAdHoc(event, el) {
        const name = el.querySelector('input#ad_hoc_input').value;
        let newApproach = undefined;
        if (name != undefined && name != "") {
            newApproach = new Approach({
                name,
                description: game.i18n.localize("fate-hybrid-skills.applications.quickAddApproach.description"),
                pc: false,
                rank: 0,
                adhoc: true
            }).toJSON();
        }

        if (newApproach !== undefined) {
            const approaches = this.object.getFlag(Constants.MODULE_ID, "approaches");
            approaches[fcoConstants.tob64(name)] = newApproach;
            await this.object.setFlag(Constants.MODULE_ID, "approaches", approaches);
            this.render(false);
        }
    }

    async onCheckAll(event, el, checked) {
        const boxes = el.querySelectorAll('input.skill_check_box');
        for (let box of boxes) {
            box.checked = checked;
        }
    }

    async onClickConfirm(event, el) {
        let updateObject = {};

        for (let idx in this.playerApproaches) {
            const name = this.playerApproaches[idx].name;
            let cbox;
            cbox = el.querySelector(`input#${name}`);

            if (cbox !== undefined && !cbox.checked) {
                updateObject[`-=${idx}`] = null;
            }
        }

        const worldApproaches = game.settings.get(Constants.MODULE_ID, 'approaches');
        for (let idx in worldApproaches) {
            const name = worldApproaches[idx].name;
            let cbox;

            cbox = el.querySelector(`input#${name}`);

            if (cbox !== undefined && cbox.checked) {
                if (fcoConstants.gbn(this.playerApproaches, name) === undefined) {
                    let approach = foundry.utils.duplicate(worldApproaches[idx]);
                    approach.rank = 0;
                    updateObject[idx] = approach;
                }
            }
        }

        await this.object.setFlag(Constants.MODULE_ID, 'approaches', updateObject);
        this.approachesWindow.render(false);
        this.close();
    }
}
