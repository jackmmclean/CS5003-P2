import {makeEntry} from "./modules/indexVue.js";
import {makeLobby} from "./modules/lobbyVue.js";

window.onload = () => {
    makeEntry();
    makeLobby();
};

