const {
	users,
	games
} = require('./data/data')
const {
	makeGame
} = require('./game')

exports.createGame = function (playerId, knockingAllowed, lowHighAceAllowed) {
	let game = makeGame(players[playerId], knockingAllowed, lowHighAceAllowed);
	games[game.id] = game;
	return game.id;
}
const {
	users,
	games
} = require('./data/data')

//for the next two functions, even though they take gameId as an argument they return it
//from the games array (just to make sure everything is lining up)
exports.joinGame = function (playerId, gameId) {
	games[gameId].addPlayer(players[playerId]);
	return games[gameId].players;
}

exports.startGame = function (gameId) {
	games[gameId].startGame();
	return games[gameId];
}

exports.getGames = function () {
	return games;
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
		return {
			status: 409,
			text: 'Username is already taken.'
		};
	} else {
		users[username] = {
			password: password,
			score: 0
		};
		return {
			status: 200,
			text: 'Registration successful.'
		}
	}
}

exports.login = function (username, password) {
	return {};
}

exports.getScore = function (username) {
	return {};
}