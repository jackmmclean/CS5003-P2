import {
	game,
	getStats
} from "./clientUtils.js";

const makeEndVue = function () {
	const endVue = new Vue({
		el: "#end",
		data: {
			scores: [],
		},
		computed: {
			state() {
				return game.state;
			}
		},
		methods: {

			getScores: function () {
				getStats().then(json => {
					let scores = json.scores;
					let niceUsernames = json.niceUsernames;
					let usernamesScores = [];
					for (let id in scores) {
						let pair = {};
						pair.niceUsername = niceUsernames[id]
						pair.score = scores[id];
						usernamesScores.push(pair);
					}
					this.scores = usernamesScores;
				})
			}
		}
	})
}

export const makeEnd = function () {
	makeEndVue();
}