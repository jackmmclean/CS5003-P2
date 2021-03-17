import {
	game,
	setState, sharedGameInfo
} from "./clientUtils.js";

const makeJoinGameByIdVue = function () {
	const joinGameByIdVue = new Vue({
		el: "#join-game-by-id",
		data: {
			gameIdJoin: "",
			message: "",
		},
		computed: {
			state() {
				return game.state;
			},
		},
		methods: {
			join: function () {

				// POST a new join request
				fetch('/api/game/join', {
					method: "POST",
					headers: {
						"Authorization": "Basic " + game.userKey,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						gameId: this.gameIdJoin
					})
				}).then((res) => {
					// Check if response is ok
					if (!res.ok) {
						throw new Error('Could not join game.')
					} else {
						return res.json()
					}
				}).then((json) => {
					// Process returned values
					game.playerId = json.playerId;
					game.gameId = json.gameId;
					setState('play');
				}).catch(err => {
					this.message = "Couldn't join game."
				})
			}
		}
	})
}

const makeNewGameVue = function () {
	const newGameVue = new Vue({
		el: "#new-game",
		data: {
			message: "",
			gameId: "",
			knockingAllowed: false,
			lowHighAceAllowed: false,
			roundMode: false
		},
		computed: {
			state() {
				return game.state;
			},
		},
		methods: {
			createNewGame: function () {

				// POST new game creation request
				fetch('/api/game/create', {
					method: "POST",
					headers: {
						"Authorization": "Basic " + game.userKey,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						gameId: this.gameId,
						knockingAllowed: this.knockingAllowed,
						lowHighAceAllowed: this.lowHighAceAllowed,
						roundMode: this.roundMode
					})
				}).then((res) => {
					// Make sure we got a 200 response
					if (!res.ok) {
						if (res.status === 409) {
							//how do i get this from the response??
							this.message = `Could not create game. Game with id "${this.gameId.trim()}" already exists.`;
						} else {
							this.message = "Couldn't create game.";
						}

					} else {
						return res.json()
					}
				}).then((json) => {

					//Process returned values
					game.playerId = json.playerId;
					game.gameId = json.gameId;
					setState('play');

				})
			}
		}
	})
}

const makeOpenGamesVue = function () {
	const openGamesVue = new Vue({
		el: "#open-games",
		data: {
			openGames: [],
			polling: null
		},
		computed: {
			state() {
				if (game.state === 'lobby') {
					// poll the games if we're in the lobby
					this.pollGames();
				}
				return game.state;
			},
		},
		methods: {
			getGames: function () {
				fetch('/api/lobby/get-games', {
					method: "GET",
					headers: {
						"Authorization": "Basic " + game.userKey
					}
				}).then((res) => {
					if (!res.ok) {
						throw new Error(`Response has status ${res.status}`)
					}
					return res.json();
				}).then((json) => {
					this.openGames = json.games;
				}).catch(err => console.log('There was an error.', err))
			},
			join: function (gameId) {
				fetch('/api/game/join', {
					method: "POST",
					headers: {
						"Authorization": "Basic " + game.userKey,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						gameId: gameId
					})
				}).then((res) => {
					if (!res.ok) {
						throw new Error('Could not join game.')
					} else {
						return res.json()
					}
				}).then((json) => {
					game.playerId = json.playerId;
					game.gameId = json.gameId;
					setState('play');
				}).catch(err => {
					this.message = "Couldn't join game."
				})
			},
			pollGames: function () {
				this.polling = setInterval(() => {
					if (game.state === 'lobby')
						this.getGames();
				}, 100)
			}
		},
		beforeDestroy: function () {
			clearInterval(this.polling)
		}
	})
}

/**
 * Show logged in user's info
 * */
const makeUserInfoVue = function() {
	const userInfoVue = new Vue({
		el: "#user-info",
		computed: {
			state() {
				return game.state;
			},
			username() {
				return sharedGameInfo.generalInfo.Username;
			},
			isRegistered() {
				return (this.username !== 'guest') && (this.username !== "");
			},
			allTimeScore() {
				return sharedGameInfo.userInfo.allTimeScore;
			},
			gamesPlayed() {
				return sharedGameInfo.userInfo.playedGames;
			}
		},
	})
}

export const makeLobby = function () {
	makeJoinGameByIdVue();
	makeNewGameVue();
	makeOpenGamesVue();
	makeUserInfoVue();
}