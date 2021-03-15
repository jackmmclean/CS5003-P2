import {
	makeEntry
} from "./modules/entryVue.js";
import {
	makeLobby
} from "./modules/lobbyVue.js";
import {
	makeGame
} from "./modules/gameVue.js";
import {
	makeHistory
} from "./modules/historyVue.js";
import {
	makeEnd
} from "./modules/endVue.js";

window.onload = () => {
	makeEntry();
	makeLobby();
	makeGame();
	makeHistory();
	makeEnd();
};