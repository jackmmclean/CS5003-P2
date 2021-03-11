import {makeEntry} from "./modules/indexVue.js";
import {makeLobby} from "./modules/lobbyVue.js";
import {makeGame} from "./modules/gameVue.js";

window.onload = () => {
    makeEntry();
    makeLobby();
    makeGame();
};

