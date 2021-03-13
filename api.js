const {
	users,
	games,
} = require('./data/data')
const {
	makeGame,
	makePlayer,
	processGinDeclared,
	getRoundGinScores
} = require('./game')
const {
	getGameByPlayerId,
	getHighestScoringPlayers
} = require('./utils')

exports.createGame = function (username, knockingAllowed, lowHighAceAllowed) {
	let game = makeGame(username, knockingAllowed, lowHighAceAllowed);
	games[game.id] = game;

	return {
		status: 200,
		gameId: game.id,
		playerId: game.owner.id,
		text: `Game with id ${game.id} successfully created.`
	}
}

//for the next two functions, even though they take gameId as an argument they return it
//from the games array (just to make sure everything is lining up)
exports.joinGame = function (username, gameId) {
	const playerId = games[gameId].addPlayer(username);

	return {
		status: 200,
		gameId: gameId,
		playerId: playerId.id,
		text: `Successfully joined game with id ${gameId}.`,
	}
}

exports.startGame = function (playerId) {
	let game = getGameByPlayerId(playerId)
	if (game.owner.id !== playerId) {
		return {
			status: 400,
			text: "Only the owner of the game can start the game."
		};
	}
	game.startGame();
	let hand = game.players[playerId].hand();
	let openDeck = game.cards.openDeck;

	return {
		status: 200,
		gameId: game.id,
		hand: hand,
		openDeck: openDeck,
		text: `Game with id ${game.id} successfully started.`
	}

}

exports.getGames = function () {
	return games;
}

exports.drawOpenCard = function (playerId) {
	// todo check if draw is even possible
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let card = player.openDraw();
	return {
		drawnCard: card,
		hand: player.hand(),
	};
}

exports.drawClosedCard = function (playerId) {
	// todo check if draw is even possible
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let card = player.closedDraw();
	return {
		drawnCard: card,
		hand: player.hand(),
	};
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

/**
 * Get info about the game.
 * @param playerId {string} Id of the requesting player
 * @returns {Object} Game stats
 * */
exports.gameStats = function (playerId) {
	const game = getGameByPlayerId(playerId);
	const numPlayers = Object.keys(game.players).length;
	return {
		numPlayers: numPlayers,
		// todo what else should we return here?
	};
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
	return {
		playerId: player.id
	};
}

/**
 * Collect data that is returned to the client on each poll request.
 * @params playerId {string} the player ID
 * */
exports.pollGame = function(playerId) {
	const game = getGameByPlayerId(playerId);
	return {
		gameHasStarted: game.timeStarted !== null,
		isOwner: game.owner.id === playerId
		// todo add more data that needs to be polled
	}
}

exports.getCards = function(playerId) {
	const game = getGameByPlayerId(playerId);
	// check if game has started
	if (game.timeStarted !== null) {
		return {
			status: 200,
			hand: game.players[playerId].hand(),
			openDeck: game.cards.openDeck,
			// todo check what else needs to be send back
		}
	} else {
		return {
			status: 400
		}
	}
}

exports.getScore = function (username) {
	return users[username].score;
}