import {
	game,
	getCards,
	getStats,
	setState
} from "./clientUtils.js";

const makeGameInfoVue = function () {
	const gameInfoVue = new Vue({
		el: "#game-info",
		data: {},
		computed: {
			state() {
				if (game.state === 'play') {
					// get the game stats if we're playing
					this.getGameStats();
					startInterval();
				}
				return game.state;
			},
			generalInfo() {
				return sharedGameInfo.generalInfo;
			}
		},
		methods: {
			getGameStats: function () {
				getStats().then((json) => {
					sharedGameInfo.generalInfo.GameID = json.gameId;
					sharedGameInfo.generalInfo.Username = (json.username == 'guest') ? 'Guest' : json.username;
					sharedGameInfo.generalInfo.Players = json.numPlayers;
				}).catch(err => console.log('Could not get stats.', err))
			}
		},
	})
}

const makePlayerHandVue = function () {
	const playerHandVue = new Vue({
		el: "#player-hand",
		data: {},
		computed: {
			state() {
				if (game.state === 'play') {
					// get the game stats if we're playing
					this.getHand();
				}
				return game.state;
			},
			hand() {
				return sharedGameInfo.hand;
			}
		},
		methods: {
			getHand: function () {
				// get cards from api
			},
			setHand: function (newHand) {
				sharedGameInfo.hand = newHand;
			},
			depositCard: (cardNo) => {
				// todo for some reason, the body is not passed on
				fetch(`/api/game/deposit-card/${game.playerId}`, {
					method: "POST",
					headers: {
						"Authorization": "Basic " + game.userKey,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						cardNo: cardNo,
						test: 123
					})
				}).then((res) => {
					if (!res.ok) {
						throw new Error(`HTTP ${res.status}`)
					} else {
						return res.json();
					}
				}).then((json) => {
					setHand(json.hand);
				}).catch(err => console.log(err))
			},
		},
	})
}

const makeClosedDeckVue = function () {
	const closedDeckVue = new Vue({
		el: "#closed-deck",
		data: {
			backOfCard: {
				card: "&#127136",
				color: "#0d47a1"
			}
		},
		computed: {
			state() {
				return game.state;
			},
			showBackOfCard() {
				return sharedGameInfo.showBackOfCard;
			},
			closedDeckCards() {
				return sharedGameInfo.closedDeckCards;
			}
		},
		methods: {
			drawFromClosedDeck: () => {
				fetch(`/api/game/draw-closed-card/${game.playerId}`, {
					method: "GET",
					headers: {
						"Authorization": "Basic " + game.userKey
					}
				}).then((res) => {
					if (!res.ok) {
						throw new Error(`HTTP ${res.status}`)
					} else {
						return res.json();
					}
				}).then((json) => {
					setHand(json.hand);
				}).catch(err => console.log(err))
			},
		}
	})
}

const makeOpenDeckVue = function () {
	const openDeckVue = new Vue({
		el: "#open-deck",
		data: {},
		computed: {
			state() {
				return game.state;
			},
			openDeckCards() {
				return sharedGameInfo.openDeckCards;
			}
		},
		methods: {
			drawFromOpenDeck: () => {
				fetch(`/api/game/draw-open-card/${game.playerId}`, {
					method: "GET",
					headers: {
						"Authorization": "Basic " + game.userKey,
					}
				}).then((res) => {
					if (!res.ok) {
						throw new Error(`HTTP ${res.status}`)
					} else {
						return res.json();
					}
				}).then((json) => {
					setHand(json.hand);
				}).catch(err => console.log(err))
			},
		},
	})
}

const makeUserActionsVue = function () {
	const userActionsVue = new Vue({
		el: "#user-actions",
		data: {},
		computed: {
			state() {
				return game.state;
			},
			showStartGameBtn() {
				return sharedGameInfo.showStartGameBtn;
			}
		},
		methods: {
			startGame: function () {
				// start the game for all players
				fetch(`/api/game/start/${game.playerId}`, {
					method: "GET",
					headers: {
						"Authorization": "Basic " + game.userKey
					}
				}).then((res) => {
					if (!res.ok) {
						throw new Error(`HTTP ${res.status}`)
					} else {
						return res.json();
					}
				}).then((json) => {
					setHand(json.hand);
					setOpenDeck(json.openDeck);
					setClosedDeck(json.deck)
					showBackOfCard();

				}).catch(err => console.log(err))
			},
			declareGin: function () {
				// todo send declare gin to API and process response
				console.log('Declare gin');
			},
			knock: function () {
				// todo send knock to API and process response
				console.log('Knock');
			},
			setHand: function (newHand) {
				sharedGameInfo.hand = newHand;
			},
		}
	})
}

const makeMessagesVue = function () {
	const messagesVue = new Vue({
		el: "#messages",
		data: {
			pastMessages: [],
			message: '',
			polling: null
		},
		methods: {
			sendMessage: function () {
				fetch('/api/game/messages', {
						method: "POST",
						headers: {
							//might change to require authentication, might not
							"Authorization": "Basic " + game.userKey,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							playerId: game.playerId,
							text: this.message
						})
					})
					.then((res) => {
						if (!res.ok) {
							throw new Error(`HTTP ${res.status}`)
						} else {
							return res.json();
						}
					})
					.then(msg => {
						this.message = '';
					})
					.catch(err => console.log(err))
			},
			pollMessages: function () {
				this.polling = setInterval(() => {
					fetch(`/api/game/messages/${game.gameId}`)
						.then(res => res.json())
						.then(res => {
							this.pastMessages = res.messages;
						})
						.catch(err => console.log(err))
				}, 100)
			}
		},
		beforeDestroy: function () {
			clearInterval(this.polling)
		},

		computed: {
			state() {
				if (game.state === 'play') {
					this.pollMessages();
				}
				return game.state
			}
		}

	})
}

const transformCards = function (numericCards) {
	let cards = []
	for (let c of numericCards) {
		cards.push({
			card: '&#' + c + ';',
			color: ((c <= 127150) || (c >= 127185)) ? "black" : "darkred",
			cardNo: c
		})
	}
	return cards;
}

const sharedGameInfo = Vue.observable({
	openDeckCards: [],
	hand: [],
	closedDeckCards: [],
	showBackOfCard: false,
	showStartGameBtn: false,
	generalInfo: {
		GameID: "1234",
		Username: "",
		Turn: "who's turn",
		Action: "possible action",
		Time: "some time",
		Players: 0,
	}
});

const setHand = (newHand) => {
	sharedGameInfo.hand = transformCards(newHand.map(el => el.char));
}

const setOpenDeck = (newOpenDeck) => {
	// show only top 5 cards of open deck
	sharedGameInfo.openDeckCards = transformCards(newOpenDeck.map(el => el.char))
		.slice(Math.max(newOpenDeck.length - 5, 0));
}

const setClosedDeck = (newClosedDeck) => {
	// show only 5 cards of closed deck
	sharedGameInfo.closedDeckCards = newClosedDeck
		.map(el => {
			return {
				card: "&#127136",
				color: "#0d47a1"
			}
		})
		.slice(Math.max(newClosedDeck.length - 5, 0))
}

const showBackOfCard = () => {
	sharedGameInfo.showBackOfCard = true;
}

const setStartGameBtn = (show) => {
	sharedGameInfo.showStartGameBtn = show
}

let pollInterval = null;

// Poll server every 100 ms: check if game has started
//  if yes (get data) else wait another 100 ms
const startInterval = () => {
	pollInterval = setInterval(() => {
		fetch(`/api/game/poll/${game.playerId}`, {
			method: "GET",
			headers: {
				"Authorization": "Basic " + game.userKey
			}
		}).then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`)
			} else {
				return res.json();
			}
		}).then(async (json) => {
			// let only owner start the game
			setStartGameBtn(json.isOwner)

			// get game stats (even if game hasn't started yet)
			getStats().then((json) => {
				sharedGameInfo.generalInfo.GameID = json.gameId;
				sharedGameInfo.generalInfo.Username = json.username.charAt(0).toUpperCase() + json.username.slice(1);
				sharedGameInfo.generalInfo.Players = json.numPlayers;
			}).catch(err => console.log('Could not get stats.', err))

			// only once the game is started
			if (json.gameHasStarted) {
				// get cards
				getCards().then((cards) => {
					setHand(cards.hand);
					setOpenDeck(cards.openDeck);
					setClosedDeck(cards.deck);
					showBackOfCard();
				}).catch(err => console.log('Could not get cards.', err))
			}

		}).catch(err => console.log(err))

	}, 1000);
}



const clearInterval = () => {
	clearInterval(pollInterval)
}

export const makeGame = function () {
	makeGameInfoVue();
	makePlayerHandVue();
	makeClosedDeckVue();
	makeOpenDeckVue();
	makeUserActionsVue();
	makeMessagesVue();
}