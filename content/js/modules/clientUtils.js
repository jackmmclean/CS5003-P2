// Vue observable that is accessible and observable by all vue components that
// reference it in a computed method.
export const game = Vue.observable({
	state: 'login',
	userKey: '',
	playerId: '',
	gameId: '',
	messages: []
});

// all allowed states
const ALLOWED_STATES = ['login', 'lobby', 'play', 'end']

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