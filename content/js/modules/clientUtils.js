// Vue observable that is accessible and observable by all vue components that
// reference it in a computed method.
export const game = Vue.observable({
	state: 'login',
	userKey: '',
	playerId: '',
	gameId: '',
	messages: []
});

export const isGuest = function () {
	return game.userKey === btoa('guest' + ':' + '');
}

// all allowed states
const ALLOWED_STATES = ['login', 'lobby', 'play', 'end', 'history']

/**
 * Set the userKey to the guest user key.
 * */
export const setGuestUser = function () {
	game.userKey = btoa('guest' + ':' + '')
};

export const sharedGameInfo = Vue.observable({
	gameHasStarted: false,
	playerIsOwner: false,
	openDeckCards: [],
	hand: [],
	closedDeckCards: [],
	showBackOfCard: false,
	knockingAllowed: false,
	roundMode: false,
	playerNames: [],
	scores: [],
	turnPlayerIndex: null,
	warningMessage: "",
	warningMessageVisible: false,
	userInfo: {
		playedGames: 0,
		allTimeScore: 0,
	},
	generalInfo: {
		GameID: "",
		Username: "",
		Players: 0,
		Round: 1,
		Time: 60
	}
});

/**
 * Set the state to a new value.
 * @param state {string} the new state.
 * */
export const setState = function (state) {
	if (ALLOWED_STATES.includes(state)) {
		game.state = state;
	} else {
		console.log(`Tried to set invalid state ${state}. Must be one of ${ALLOWED_STATES}.`)
	}
	// reset values appropriately
	if (state === "login" || state === "lobby") {
		game.playerId = "";
		game.gameId = "";
		game.messages = [];

		// reset sharedGameInfo
		sharedGameInfo.gameHasStarted = false,
		sharedGameInfo.playerIsOwner = false,
		sharedGameInfo.openDeckCards = [],
		sharedGameInfo.hand = [],
		sharedGameInfo.closedDeckCards = [],
		sharedGameInfo.showBackOfCard = false,
		sharedGameInfo.knockingAllowed = false,
		sharedGameInfo.roundMode = false,
		sharedGameInfo.playerNames = [],
		sharedGameInfo.scores = [],
		sharedGameInfo.turnPlayerIndex = null,
		sharedGameInfo.warningMessage = "",
		sharedGameInfo.warningMessageVisible = false,
		sharedGameInfo.userInfo= {
				playedGames: 0,
				allTimeScore: 0,
		},
		sharedGameInfo.generalInfo = {
				GameID: "",
				Username: "",
				Players: 0,
				Round: 1,
				Time: 60
		}

	} if (state === "login") {
		game.userKey = "";
	}
}

/**
 * Authenticate a user with the server using the gameState.userKey user data.
 * @returns {int} HttpStatus (200 if successful, 401 if authentication failed)
 * */
export const login = function () {
	return fetch("/api/users/login", {
		method: "POST",
		headers: {
			"Authorization": "Basic " + game.userKey
		}
	}).then((res) => {
		if (!res.ok) {
			return {};
		} else {
			return res.json();
		}
	})
}

/**
 * Get the cards of the game (after the game has started)
 * @returns {object} cards
 * */
export const getCards = function () {
	return fetch(`/api/game/get-cards/${game.playerId}`, {
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
	}).catch(err => console.log(err))
}

export const getStats = function () {
	return fetch(`/api/game/game-stats/${game.playerId}`, {
		method: "GET",
		headers: {
			"Authorization": "Basic " + game.userKey
		},
	}).then((res) => {
		if (!res.ok) {
			throw new Error(`HTTP Error ${res.status}`)
		} else {
			return res.json();
		}
	})
}

export const arraysEqual = function (array1, array2) {

	if (array1.length !== array2.length) return false;

	for (var i = 0; i < array1.length; ++i) {
		if (array1[i].id != array2[i].id) {
			return false;
		}
	}
	return true;
}

export const transformCards = function (numericCards) {
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


export const compareScore = function (a, b) {
	if (a.score > b.score) {
		return -1;
	}
	if (a.score < b.score) {
		return 1;
	}
	return 0;
}