import {makeEntry} from "./modules/entryVue.js";
import {makeLobby} from "./modules/lobbyVue.js";
import {makeGame} from "./modules/gameVue.js";

window.onload = () => {
    makeEntry();
    makeLobby();
    makeGame();
};

