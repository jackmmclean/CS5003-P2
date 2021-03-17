import {
	game,

} from "./clientUtils.js";

const makeHistoryVue = function () {
	const historyVue = new Vue({
		el: "#history",
		data: {
			cardHistoryInstance: [1, 2, 3, 4],
			cardHistory: [],
			scores: {},
			index: 0,
			round: 0
		},
		methods: {
			getCardHistory: function () {
				fetch(`/api/game/game-stats/${game.playerId}`, {
						method: "GET",
						headers: {
							"Authorization": "Basic " + game.userKey,
						}
					})
					.then((res) => {
						if (!res.ok) {
							throw new Error(`HTTP ${res.status}`)
						} else {
							return res.json();
						}
					})
					.then((json) => {
						this.cardHistory = json.cardHistory;
						this.index = this.cardHistory.length - 1;
						this.cardHistoryInstance = this.cardHistory[this.index];
						this.round = this.cardHistoryInstance.round;
						this.scores = this.cardHistoryInstance.scores;
					})
					.catch(err => console.log(err))
			},

			getInstanceForward: function () {
				if (this.index === this.cardHistory.length - 1) {
					console.log('Cannot access later instance - this is the latest instance.');
					return
				}
				this.index++
				this.cardHistoryInstance = this.cardHistory[this.index];
				this.round = this.cardHistoryInstance.round;
				this.scores = this.cardHistoryInstance.scores;
			},
			getInstanceBack: function () {
				if (this.index === 0) {
					console.log('Cannot access earlier instance - this is the earliest instance.');
					return
				}
				this.index--
				this.cardHistoryInstance = this.cardHistory[this.index];
				this.round = this.cardHistoryInstance.round;
				this.scores = this.cardHistoryInstance.scores;
			}

		},
		computed: {
			state() {
				if (game.state === 'history') {
					// get the game stats if we're playing
					this.getCardHistory();
				}
				return game.state;
			}

		}
	})
}

export const makeHistory = function () {
	makeHistoryVue();
}