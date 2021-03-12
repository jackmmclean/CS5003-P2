const {
	users,
	games,
} = require('./data/data')
const {
	makeGame, makePlayer,
	processGinDeclared,
	getRoundGinScores
} = require('./game')
const {
	getGameByPlayerId,
	getHighestScoringPlayers
} = require('./utils')

exports.createGame = function (playerId, knockingAllowed, lowHighAceAllowed) {
	let game = makeGame(playerId, knockingAllowed, lowHighAceAllowed);
	games[game.id] = game;

	return {
		status: 200,
		gameId: game.id,
		text: `Game with id ${game.id} successfully created.`
	}

}

//for the next two functions, even though they take gameId as an argument they return it
//from the games array (just to make sure everything is lining up)
exports.joinGame = function (playerId, gameId) {
	games[gameId].addPlayer(playerId);

	return {
		status: 200,
		gameId: game.id,
		text: `Successfully joined game with id ${game.id}.`,
	}

}

exports.startGame = function (gameId) {
	games[gameId].startGame();

	return {
		status: 200,
		gameId: game.id,
		text: `Game with id ${game.id} successfully started.`
	}

}

exports.getGames = function () {
	return games;
}

exports.drawOpenCard = function (playerId) {
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let card = player.openDraw();
	return card;
}

exports.drawClosedCard = function (playerId) {
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let card = player.closedDraw();
	return card;
}

exports.depositCard = function (playerId, card) {
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let hand = player.depositCard(card);
	return hand;
}

exports.declareGin = function (playerId) {
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	//need some more logic here to deal with winning and losing etc
	if (processGinDeclared(player)) {
		getRoundGinScores(game, player);
		game.endGame();
	} else {
		game.endGame();
	}
	return {
		text: 'Game is over',
		winners: getHighestScoringPlayers(game.players)
	};

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

exports.makePlayerOnLogin = function (username) {
	const player = makePlayer(username)
	return {playerId: player.id};
}

exports.getScore = function (username) {
	return users[username].score;
}