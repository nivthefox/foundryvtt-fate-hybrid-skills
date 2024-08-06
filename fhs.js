import * as FHSHooks from './scripts/Hooks.js';
import * as Settings from './scripts/Settings.js';

(function fhs() {
    Hooks.on('init', FHSHooks.init);
    Hooks.once('ready', Settings.registerSettings);  
    Hooks.on('preCreateActor', FHSHooks.createActorApproaches);
    Hooks.on('renderfcoCharacter', FHSHooks.renderApproaches);    
})();
