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
	if (state === "login") {
		game.userKey = "";
		game.playerId = "";
		game.gameId = "";
		game.messages = [];
	} else if (state === "lobby") {
		game.playerId = "";
		game.gameId = "";
		game.messages = [];
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
		return res.status;
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