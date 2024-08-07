import {Approach} from './Models.js';
import * as Constants from './Constants.js';

export class ApproachSetup extends FormApplication {
    constructor(...args) {
        super(...args);
        game.system.approachSetup = this;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `modules/${Constants.MODULE_ID}/templates/ApproachSetup.hbs`;
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-hybrid-skills.applications.approachSetup.title")} ${game.world.title}`;
        options.closeOnSubmit = false;
        options.resizable = false;
        return options;
    }

    getData() {
        this.approaches = fcoConstants.sortByName(game.settings.get(Constants.MODULE_ID, "approaches"));
        this.approaches_label = game.settings.get(Constants.MODULE_ID, "approachesLabel");
        const templateData = {
            approaches: this.approaches,
            approaches_label: this.approaches_label,
        }
        return templateData;
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        const addButton = html.find("button[id='addApproach']");
        const copyButton = html.find("button[id='copyApproach']");
        const deleteButton = html.find("button[id='deleteApproach']");
        const editButton = html.find("button[id='editApproach']");
        const exportButton = html.find("button[id='exportApproach']");
        const exportAllButton = html.find("button[id='exportApproaches']");
        const importAllButton = html.find("button[id='importApproaches']");
        const editLabel = html.find("#approachesLabelEdit");
        const selectBox = html.find("select[id='approachesListBox']");

        addButton.on('click', event => this.onAddButton(event, html));
        copyButton.on('click', event => this.onCopyButton(event, html));
        deleteButton.on('click', event => this.onDeleteButton(event, html));
        editButton.on('click', event => this.onEditButton(event, html));
        selectBox.on('dblclick', event => this.onEditButton(event, html));
        exportButton.on('click', event => this.onExportButton(event, html));
        exportAllButton.on('click', event => this.onExportAllButton(event, html));
        importAllButton.on('click', event => this.onImportAllButton(event, html));
        editLabel.on('click', event => this.onLabelEdit(event, html, editLabel));
    }

    async _updateObject(){
    }

    getSelectedApproachKey(html) {
        let approachesListBox = html.find("select[id='approachesListBox']")[0].value;
        let approaches = game.settings.get(Constants.MODULE_ID, "approaches");
        let key = fcoConstants.gkfn(approaches, approachesListBox);
        return key;
    }

    getSelectedApproach(html) {
        let key = this.getSelectedApproachKey(html);
        let approaches = game.settings.get(Constants.MODULE_ID, 'approaches');
        return approaches[key];
    }

    async importApproaches() {
        return new Promise(resolve => {
            const content = renderTemplate(`modules/${Constants.MODULE_ID}/templates/ImportExportApproaches.hbs`, {mode: 'import'});
            new Dialog({
                title: game.i18n.localize("fate-hybrid-skills.applications.importApproaches.title"),
                content,
                buttons: {
                    ok: {
                        label: 'Save',
                        callback: () => resolve(document.getElementById('import_approaches').value)
                    }
                }
            }).render(true);
        });
    }

    async onAddButton(event, html) {
        let edit = new EditApproach();
        edit.render(true);
        try {
            edit.bringToTop();
        } catch {
            // Do nothing.
        }
    }

    async onCopyButton(event, html) {
        let approach = this.getSelectedApproach(html);
        if (approach == undefined) {
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectASkillToCopyFirst"));
            return;
        }

        let approaches = game.settings.get(Constants.MODULE_ID, "approaches");
        let newApproach = foundry.utils.duplicate(approach);
        newApproach.name = `${approach.name} ${game.i18n.localize("fate-core-official.copy")}`;
        approaches[fcoConstants.tob64(newApproach.name)] = newApproach;
        await game.settings.set(Constants.MODULE_ID, "approaches", approaches);
        this.render(true);
        try {
            this.bringToTop();
        } catch {
            // Do nothing.
        }
    }

    async onDeleteButton(event, html) {
        let del = await fcoConstants.confirmDeletion();
        if (del) {
            let approaches = game.settings.get(Constants.MODULE_ID, "approaches");
            let key = this.getSelectedApproachKey(html);
            delete approaches[key];
            await game.settings.set(Constants.MODULE_ID, "approaches", approaches);
            this.render(true);
        }
    }

    async onEditButton(event, html) {
        // Lanch the EditApproach FormApplication.
        let approach = this.getSelectedApproach(html);
        let edit = new EditApproach(approach);
        edit.render(true);
        try {
            edit.bringToTop();
        } catch {
            // Do nothing.
        }
    }

    async onExportButton(event, html) {
        let key = this.getSelectedApproachKey(html);
        let approach = this.getSelectedApproach(html);
        let text = `{"${key}": ${JSON.stringify(approach, null, 5)}}`;
        const content = renderTemplate(`modules/${Constants.MODULE_ID}/templates/ImportExportApproaches.hbs`, {mode: 'export', text});
        new Dialog({
            title: game.i18n.localize("fate-hybrid-skills.applications.exportApproach.title"),
            content,
            buttons: {}
        }).render(true);
    }

    async onExportAllButton(event, html) {
        let approaches = game.settings.get(Constants.MODULE_ID, 'approaches');
        let text = JSON.stringify(approaches, null, 5);
        const content = renderTemplate(`modules/${Constants.MODULE_ID}/templates/ImportExportApproaches.hbs`, {mode: 'export', text});
        new Dialog({
            title: game.i18n.localize("fate-hybrid-skills.applications.exportApproaches.title"),
            content,
            buttons: {}
        }).render(true);
    }

    async onImportAllButton(event, html) {
        let text = await this.importApproaches();
        let importData;
        try {
            importData = JSON.parse(text);
        } catch(e) {
            ui.notifications.error(e);
            return;
        }

        let approaches = foundry.utils.duplicate(game.settings.get(Constants.MODULE_ID, 'approaches'));
        if (approaches == undefined) {
            approaches = {};
        }

        if (!importData.hasOwnProperty('name')) {
            // This is an approach object
            for (let key in importData) {
                let newApproach = new Approach(importData[key]).toJSON();
                if (newApproach) {
                    approaches[fcoConstants.tob64(newApproach.name)] = newApproach;
                }
            }
        } else {
            // This is a single approach
            let newApproach = new Approach(importData).toJSON();
            if (newApproach) {
                approaches[fcoConstants.tob64(newApproach.name)] = newApproach;
            }
        }

        await game.settings.set(Constants.MODULE_ID, 'approaches', approaches);
        this.render(false);
    }

    async onLabelEdit(event, html, editLabel) {
        const inputId = `#${editLabel.data('edit-element')}`;
        const inputBox = html.find(inputId);
        const isEditing = editLabel.hasClass('inactive');
        if (inputBox.length && !isEditing) {
            editLabel.addClass('inactive');
            inputBox.removeAttr('disabled')
                .focus()
                .on('blur.edit_label', async () => {
                    inputBox.attr('disabled', 'disabled');
                    inputBox.off('blur.edit_label');
                    const value = inputBox.val();
                    await game.settings.set(Constants.MODULE_ID, 'approachesLabel', value);
                    editLabel.removeClass('inactive');
                });
        }
    }
}
