import {
	game,

} from "./clientUtils.js";

const makeHistoryVue = function () {
	const endVue = new Vue({
		el: "#history",
		data: {
			cardHistoryInstance: [1, 2, 3, 4],
			cardHistory: [],
			index: 0
		},
		computed: {
			state() {
				return game.state;
			},
			init() {
				this.getCardHistory();
			}
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
						console.log(this.cardHistory)
						this.index = this.cardHistory.length - 1;
						this.cardHistoryInstance = this.cardHistory[this.index];
					})
					.catch(err => console.log(err))
			},

			getInstanceForward: function () {
				if (this.index === this.cardHistory.length - 1) {
					console.log('too far up');
					return
				}
				this.index++
				this.cardHistoryInstance = this.cardHistory[this.index];
			},
			getInstanceBack: function () {
				if (this.index === 0) {
					console.log('too far down');
					return
				}
				this.index--
				this.cardHistoryInstance = this.cardHistory[this.index];
			}

		}
	})
}

export const makeHistory = function () {
	makeHistoryVue();
}