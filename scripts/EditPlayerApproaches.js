import * as Constants from './Constants.js';
import { EditGMApproaches } from './EditGMApproaches.js'

export class EditPlayerApproaches extends FormApplication {
    constructor(...args) {
        super(...args);

        if (this.object.type == 'Extra') {
            let title = game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.titleForExtra");
            this.options.title = `${title} ${this.object.name}`;
            game.systems.apps["item"].push(this);
        } else {
            this.firstRun = true;
            if (this.object.isToken) {
                this.options.title=`${game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.titleForToken")} ${this.object.name}`
            } else {
                this.options.title=`${game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.titleFor")} ${this.object.name}`
            }
        }

        this.firstRun = true;
        this.playerApproaches =  foundry.utils.duplicate(this.object.getFlag(Constants.MODULE_ID, "approaches"));
        this.isRankSorted = true;
        this.temporaryPresentationApproaches = [];
        this.sorted = false;
        this.changed = false;

        game.system.apps["actor"].push(this);
        game.system.apps["item"].push(this);
    }

    setSheet (ActorSheet) {
        this.sheet = ActorSheet;
    }

    async renderMe(id, data, object) {
        if (this?.object?.id == id) {
            //The following code debounces the render, preventing multiple renders when multiple simultaneous update requests are received.
            if (!this.renderPending) {
                this.renderPending = true;
                setTimeout(() => {
                    this.render(false);
                    this.renderPending = false;
                }, 50);
            }
        }
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = 'modules/fate-hybrid-skills/templates/EditPlayerApproaches.hbs';
        options.height = 'auto';
        options.title = game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.title");
        options.closeOnSubmit = true;
        options.id = "PlayerApproachSetup";
        options.resizable = true;
        options.scrollY=["#approach_editor"];
        options.width = "auto";  
        options.classes = options.classes.concat(['fate']);
        return options;
    }

    async _updateObject(event, formData) {
        for (let approach in formData) {
            let name = approach.split("_")[0];
            let rank = parseInt(formData[approach]);
            let playerApproach = fcoConstants.gbn(this.playerApproaches, name);
            playerApproach.rank = rank;
        }

        if (this.object.type == 'Extra') {
            await this.object.setFlag(Constants.MODULE_ID, "approaches", this.playerApproaches);
            ui.notifications.info(game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.savedExtra"));
            this.changed = false;
            this.close();
            return;
        }
        
        const isPlayer = this.object.hasPlayerOwner;
        const canSave = await this.checkApproaches(this.playerApproaches);
        if (!game.user.isGM && isPlayer && !canSave) {
            ui.notifications.error(game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.unableToSave"))
            return;
        } 

        // todo: setup tracks (see fco/EditPlayerSkills:91-93)
        await this.object.setFlag(Constants.MODULE_ID, "approaches", this.playerApproaches);
        ui.notifications.info(game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.saved"));
        this.changed = false;
        this.close();
    }

    async checkApproaches(approaches) {
        // todo
        return true;
    }

    async close(...args) {
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this), 1);
        game.system.apps["item"].splice(game.system.apps["item"].indexOf(this), 1);

        if (this.changed) {
            let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.abandonChangesQ"), game.i18n.localize("fate-core-official.abandonChanges"));
            if (answer == "yes") {
                await super.close(...args);
            }
        } else {
            await super.close(...args);
        }
    }

    async getData() {
        this.playerApproaches = foundry.utils.duplicate(this.object.flags[Constants.MODULE_ID].approaches);
        this.playerApproaches = fcoConstants.sortByName(this.playerApproaches);

        if (this.firstRun) {
            await this.checkApproaches(this.playerApproaches);
            this.firstRun = false;
        }

        let presentationApproaches = [];
        if (this.temporaryPresentationApproaches.length > 0) {
            presentationApproaches = foundry.utils.duplicate(this.temporaryPresentationApproaches);
            this.temporaryPresentationApproaches = [];
        } else {
            for (let key in this.playerApproaches) {
                presentationApproaches.push({
                    name: this.playerApproaches[key].name,
                    rank: this.playerApproaches[key].rank,
                    extra_id: this.playerApproaches[key].extra_id
                });
            }
        }

        if (!this.sorted) {
            this.sortByName(presentationApproaches);
            this.sorted = true;
        }

        const templateData = {
            approachList: game.settings.get(Constants.MODULE_ID, "approaches"),
            characterApproaches: presentationApproaches,
            isGM: game.user.isGM,
            isExtra: this.object.type == 'Extra'
        }

        return templateData;
    }

    activateListeners(html) {
        super.activateListeners(html);

        const el = html[0];
        
        const rankBoxes = el.querySelectorAll('input.rank_input');
        rankBoxes.forEach(rankBox => rankBox.addEventListener('change', () => this.changed = true));

        const approachButtons = el.querySelectorAll("button[class='skill_button']");
        approachButtons.forEach(button => button.addEventListener('click', event => this.onClickApproach(event, el)));

        const editButton = el.querySelector('button#edit_p_approaches');
        editButton.addEventListener('click', event => this.onClickEdit(event, el));

        const saveButton = el.querySelector('button#save_player_approaches');
        saveButton.addEventListener('click', event => this.onClickSave(event, el));

        const sortButton = el.querySelector('button#sort');
        sortButton.addEventListener('click', event => this.onClickSort(event, el));
    }

    async onClickApproach(event, el) {
        const name = event.target.id;
        const approach = fcoConstants.gbn(this.playerApproaches, name);
        const content = await renderTemplate(`modules/${Constants.MODULE_ID}/templates/EditPlayerApproach.hbs`, {approach});
        
        new Dialog({
            title: "Test",
            content,
            buttons: {
                ok: {
                    label: game.i18n.localize("fate-core-official.OK"),
                }
            },
            default: "ok"
        }, {
            width: 1000,
            height: 'auto'
        }).render(true);
    }

    async onClickEdit(event, el) {
        if (!game.user.isGM && !this.object.type == 'Extra') {
            ui.notifications.error(game.i18n.localize("fate-hybrid-skills.applications.editPlayerApproaches.onlyGMs"));
            return;
        }
    
        const editor = new EditGMApproaches(this.object);
        await editor.render(true);
        editor.approachesWindow = this;
        try {
            editor.bringToTop();
        } catch { 
            // do nothing
        }
    }

    async onClickSave(event, el) {
        this.submit();
    }

    async onClickSort(event, el) {
        this.temporaryPresentationApproaches = [];
        const unsorted = [];
        const inputs = el.querySelectorAll('input[type="number"]');
        for (let idx = 0; idx < inputs.length; idx++) {
            const name = inputs[idx].id.split("_")[0];
            const rank = parseInt(inputs[idx].value);
            unsorted.push({name, rank});
        }

        if (this.isRankSorted) {
            this.sortByRank(unsorted);
        } else {
            this.sortByName(unsorted);
        }

        this.temporaryPresentationApproaches = unsorted;
        await this.render(false);
        this.isRankSorted = !this.isRankSorted;
    }

    sortByName(array){
        array.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    }

    sortByRank(array) {
        array.sort((a, b) => a.rank < b.rank ? 1 : a.rank > b.rank ? -1 : 0);
    }
}
