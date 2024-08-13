import * as Constants from "./Constants.js";
import * as Log from "./Log.js";
import { ApproachSetup } from "./ApproachSetup.js";

export function registerSettings() {
    game.settings.register(Constants.MODULE_ID, "approachesLabel", {
        name: game.i18n.localize("fate-hybrid-skills.settings.approachesLabel.name"),
        hint: game.i18n.localize("fate-hybrid-skills.settings.approachesLabel.hint"),
        scope: "world",
        config: false,
        type: String,
        restricted: true,
        default: game.i18n.localize("fate-hybrid-skills.settings.approachesLabel.default"),
    });

    game.settings.register(Constants.MODULE_ID, "approaches", {
        name: game.i18n.localize("fate-hybrid-skills.settings.approaches.name"),
        hint: game.i18n.localize("fate-hybrid-skills.settings.approaches.hint"),
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });

    game.settings.register(Constants.MODULE_ID, "sortApproaches", {
        name: game.i18n.localize("fate-hybrid-skills.settings.sortApproaches.name"),
        hint: game.i18n.localize("fate-hybrid-skills.settings.sortApproaches.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.registerMenu(Constants.MODULE_ID, "ApproachSetup", {
        name: game.i18n.localize("fate-hybrid-skills.settings.ApproachSetup.name"),
        label: game.i18n.localize("fate-hybrid-skills.settings.ApproachSetup.label"),
        hint: game.i18n.localize("fate-hybrid-skills.settings.ApproachSetup.hint"),
        type: ApproachSetup,
        restricted: true // gamemaster only
    });

    game.settings.register(Constants.MODULE_ID, "replaceApproaches", {
        name: game.i18n.localize("fate-hybrid-skills.settings.replaceApproaches.name"),
        hint: game.i18n.localize("fate-hybrid-skills.settings.replaceApproaches.hint"),
        scope: "world",
        config: true,
        type: String,
        restricted: true,
        requiresReload: true,
        choices: {
            "nothing": game.i18n.localize("fate-core-official.No"),
            "accelerated": game.i18n.localize("fate-core-official.YesFateAccelerated"),
            "dfa": game.i18n.localize("fate-core-official.YesDFA"),
            "clearAll": game.i18n.localize("fate-core-official.YesClearAll"),
        },
        default: "nothing",
        onChange: async (value) => {
            if (value == "nothing") {
                return;
            }

            if (!game.user.isGM) {
                game.settings.set(Constants.MODULE_ID, "replaceApproaches", "nothing");
                return;
            }

            let newApproaches = {};
            switch (value) {
                case "accelerated":
                    newApproaches = game.system["lang"]["FateAcceleratedDefaultSkills"];
                    break;
                case "dfa":
                    newApproaches = game.system["lang"]["DresdenFilesAcceleratedDefaultSkills"];
                    break;
            }

            let approaches = {};
            for (let approach in newApproaches) {
                let key = fcoConstants.tob64(newApproaches[approach].name);
                approaches[key] = newApproaches[approach];
            }

            await game.settings.set(Constants.MODULE_ID, "approaches", approaches);
            await game.settings.set(Constants.MODULE_ID, "replaceApproaches", "nothing");
        }
    })

    Log.debug("Settings Registered");
}
