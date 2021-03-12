const {users} = require('./data/data')

exports.createGame = function (names, knockingAllowed, lowHighAceAllowed, numPlayers) {
	return {};
}

exports.startGame = function (playerId) {
	return {};
}

exports.getGames = function () {
	return {
		"test-text": "this is a test"
	};
}

exports.joinGame = function (gameId) {
	return {};
}

exports.drawOpenCard = function (playerId) {
	return {
		// card: cards.openDraw(playerId)
	};
}

exports.drawClosedCard = function (playerId) {
	return {
		// card: cards.openDraw(playerId)
	};
}

exports.depositCard = function (playerId, cardNo) {

	// card: cards.openDraw(playerId, cardNo)

}

exports.declareGin = function (playerId) {

	return {};

}

exports.gameStats = function (gameId) {
	return {};
}

exports.registerUser = function (username, password) {
	// make sure the user doesn't exist yet
	if (users.hasOwnProperty(username)) {
		// return 409
		return {status: 409, text: 'Username is already taken.'};
	} else {
		users[username] = {password: password, score: 0};
		return {status: 200, text: 'Registration successful.'}
	}
}

exports.login = function (username, password) {
	return {};
}

exports.getScore = function (username) {
	return {};
}