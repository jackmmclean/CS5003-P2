import {
	game,
	getCards,
	getStats,
	setState,
	arraysEqual,
	transformCards,
	sharedGameInfo,

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
			},
			roundMode() {
				return sharedGameInfo.roundMode;
			},
			warningMessageVisible() {
				return sharedGameInfo.warningMessageVisible;
			},
			warningMessage() {
				return sharedGameInfo.warningMessage;
			}
		},
		methods: {
			getGameStats: function () {
				getStats().then((json) => {
					sharedGameInfo.generalInfo.GameID = json.gameId;
					sharedGameInfo.generalInfo.Username = json.niceUsername;
					sharedGameInfo.generalInfo.Players = json.numPlayers;
				}).catch(err => console.log('Could not get stats.', err))
			},
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
			},
			gameHasStarted() {
				return sharedGameInfo.gameHasStarted;
			},
			isOwner() {
				return sharedGameInfo.playerIsOwner;
			},
			numPlayers() {
				return sharedGameInfo.generalInfo.Players;
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
				fetch(`/api/game/deposit-card/${game.playerId}`, {
					method: "POST",
					headers: {
						"Authorization": "Basic " + game.userKey,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						cardNo: cardNo,
					})
				}).then((res) => res.json()).then((json) => {
					if (json.status === 405) {
						showUserMessage(json.text);
					} else if (json.status === 200) {
						setHand(json.hand);
					} else {
						throw Error(`Http error: ${json.status}`)
					}
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
			},
			gameHasStarted() {
				return sharedGameInfo.gameHasStarted;
			}
		},
		methods: {
			drawFromClosedDeck: () => {
				fetch(`/api/game/draw-closed-card/${game.playerId}`, {
					method: "GET",
					headers: {
						"Authorization": "Basic " + game.userKey
					}
				}).then((res) => res.json()).then((json) => {
					if (json.status === 405) {
						showUserMessage(json.text);
					} else if (json.status === 200) {
						setHand(json.hand);
					} else {
						throw Error(`Http error: ${json.status}`)
					}
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
			},
			gameHasStarted() {
				return sharedGameInfo.gameHasStarted;
			}
		},
		methods: {
			drawFromOpenDeck: () => {
				fetch(`/api/game/draw-open-card/${game.playerId}`, {
					method: "GET",
					headers: {
						"Authorization": "Basic " + game.userKey,
					}
				}).then((res) => res.json()).then((json) => {
					if (json.status === 405) {
						showUserMessage(json.text);
					} else if (json.status === 200) {
						setHand(json.hand);
					} else {
						throw Error(`Http error: ${json.status}`)
					}
				}).catch(err => console.log(err))
			},
		},
	})
}

const makeUserActionsVue = function () {
	const userActionsVue = new Vue({
		el: "#user-actions",
		computed: {
			state() {
				return game.state;
			},
			isOwner() {
				return sharedGameInfo.playerIsOwner;
			},
			isKnockingAllowed() {
				return sharedGameInfo.knockingAllowed;
			},
			gameHasStarted() {
				return sharedGameInfo.gameHasStarted;
			},
			numPlayers() {
				return sharedGameInfo.generalInfo.Players;
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
				}).then((res) => res.json()).then((json) => {
					if (json.status === 405) {
						showUserMessage(json.text)
					} else if (json.status === 200) {
						setHand(json.hand);
						setOpenDeck(json.openDeck);
						setClosedDeck(json.deck)
						showBackOfCard();
					} else {
						throw Error(`Http error: ${json.status}`)
					}
				}).catch(err => console.log(err))
			},
			//todo whose turn should it be for a new round?
			declareGin: function () {
				fetch(`/api/game/declare-gin/${game.playerId}`, {
						method: "POST",
						headers: {
							"Authorization": "Basic " + game.userKey,
							"Content-Type": "application/json",
						}
					}).then((res) => res.json())
					.then((json) => {
						if (json.status === 405) {
							showUserMessage(json.text);
						} else if (json.status === 200) {
							if (json.winners == null) {
								showUserMessage(json.text);
							} else {
								showUserMessage(json.text);
								setState('end');
							}
						} else {
							throw Error(`Http error: ${json.status}`)
						}
					}).catch(err => console.log(err))
			},
			knock: function () {
				fetch(`/api/game/knock/${game.playerId}`, {
						method: "POST",
						headers: {
							"Authorization": "Basic " + game.userKey,
							"Content-Type": "application/json",
						}
					}).then((res) => res.json())
					.then((json) => {
						if (json.status === 200) {
							if (json.winners == null) {
								showUserMessage(json.text);
							} else {
								showUserMessage(json.text);
								setState('end');
							}
						} else {
							throw Error(`Http error: ${json.status}`)
						}
					}).catch(err => console.log(err))
			},
			setHand: function (newHand) {
				sharedGameInfo.hand = newHand;
			},
		}
	})
}

const makeTurnIndicatorVue = function () {
	const turnIndicatorVue = new Vue({
		el: "#turn-indicator",
		data: {},
		computed: {
			state() {
				return game.state;
			},
			playerNames() {
				return sharedGameInfo.playerNames;
			},
			turnPlayerIndex() {
				return sharedGameInfo.turnPlayerIndex;
			},
			scores() {
				return sharedGameInfo.scores;
			},
			roundMode() {
				return sharedGameInfo.roundMode;
			},
			gameHasStarted() {
				return sharedGameInfo.gameHasStarted;
			}
		},
		methods: {
			isTurnPlayer(idx) {
				return idx === this.turnPlayerIndex;
			}
		},
	})
}

const makeMessagesVue = function () {
	const messagesVue = new Vue({
		el: "#messages",
		data: {
			pastMessages: [],
			message: '',
			polling: null,
			playerId: game.playerId
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
							throw Error(`HTTP ${res.status}`)
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
					if (game.state === 'play') {
						fetch(`/api/game/messages/${game.gameId}`)
							.then(res => res.json())
							.then(res => {
								if (!arraysEqual(this.pastMessages, res.messages)) {
									this.pastMessages = res.messages;
									for (let pastMessage of this.pastMessages) {
										pastMessage['isMyMsg'] = (game.playerId === pastMessage.playerId);
									}
									setTimeout(function () {
										//have to ensure that the element has rendered before scrolling to bottom, 
										//kept having it scroll to second last element!! tried using an interval to keep checking
										//but couldn't get it to work, this is hacky but clean!
										document.getElementById('messagesData').scrollTop = document.getElementById('messagesData').scrollHeight;
									}, 200)
								}
							})
							.catch(err => console.log(err))
					}
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


let warningTimer = null;

const showUserMessage = (msg) => {
	clearTimeout(warningTimer);
	sharedGameInfo.warningMessageVisible = true;
	sharedGameInfo.warningMessage = msg;
	warningTimer = setTimeout(() => sharedGameInfo.warningMessageVisible = false, 1500)
}

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

let niceUsernames = [];

// Poll server every 100 ms: check if game has started
//  if yes (get data) else wait another 100 ms
const startInterval = () => {
	sharedGameInfo.pollInterval = setInterval(() => {
		fetch(`/api/game/poll/${game.playerId}`, {
			method: "GET",
			headers: {
				"Authorization": "Basic " + game.userKey
			}
		}).then((res) => {
			if (!res.ok) {
				//if player is removed
				if (res.status === 408) {
					alert('You timed out.');
					clearInterval(sharedGameInfo.pollInterval);
					// need to reset usernames for next game
					niceUsernames = []
					setState('login');
				}
				throw Error(`HTTP ${res.status}`);
			} else {
				return res.json();
			}
		}).then(async (json) => {
			// let only owner start the game
			sharedGameInfo.playerIsOwner = json.isOwner;
			sharedGameInfo.knockingAllowed = json.knockingAllowed;
			sharedGameInfo.roundMode = json.roundMode;
			sharedGameInfo.playerNames = json.playerNames;
			sharedGameInfo.turnPlayerIndex = json.turnPlayerIndex;
			sharedGameInfo.scores = json.scores;


			// get game stats (even if game hasn't started yet)
			getStats().then((json) => {
				sharedGameInfo.generalInfo.GameID = json.gameId;
				sharedGameInfo.generalInfo.Username = json.niceUsername;
				sharedGameInfo.generalInfo.Players = json.numPlayers;
				sharedGameInfo.generalInfo.Round = json.round;
				sharedGameInfo.generalInfo.Time = json.turnTimeLeft;
				sharedGameInfo.userInfo.gamesLost = json.gamesLost;
				sharedGameInfo.userInfo.gamesWon = json.gamesWon;
				sharedGameInfo.userInfo.allTimeScore = json.allTimeScore;

				let incomingNiceUsernames = Object.entries(json.niceUsernames).map(el => el[1]);

				if (!arraysEqual(niceUsernames, incomingNiceUsernames)) {
					if (niceUsernames.length < incomingNiceUsernames.length) {

						let newcomer = incomingNiceUsernames.filter(el => !niceUsernames.includes(el))
						showUserMessage(`${newcomer[0]} has joined the game.`)
					} else {
						let leaver = niceUsernames.filter(el => !incomingNiceUsernames.includes(el))
						showUserMessage(`${leaver[0]} has left the game.`)
					}
				}
				niceUsernames = incomingNiceUsernames;
			}).catch(err => console.log('Could not get stats.', err))

			// only once the game is started
			if (json.gameHasStarted) {
				sharedGameInfo.gameHasStarted = true;
				// get cards
				getCards().then((cards) => {
					setHand(cards.hand);
					setOpenDeck(cards.openDeck);
					setClosedDeck(cards.deck);
					showBackOfCard();
				}).catch(err => console.log('Could not get cards.', err))
			}
			// process what happens when the game is over

			if (json.gameHasFinished) {
				setState('end');
				clearInterval(sharedGameInfo.pollInterval);
			}

		}).catch(err => console.log(err))

	}, 1000);
}

export const makeGame = function () {
	makeGameInfoVue();
	makePlayerHandVue();
	makeClosedDeckVue();
	makeOpenDeckVue();
	makeUserActionsVue();
	makeTurnIndicatorVue();
	makeMessagesVue();
}