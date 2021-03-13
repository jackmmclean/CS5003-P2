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

exports.createGame = function (username, knockingAllowed, lowHighAceAllowed, gameId = '') {

	gameId = gameId.trim();

	if (games.hasOwnProperty(gameId)) {

		return {
			status: 409,
			gameId: gameId,
			text: `Could not create game. Game with id "${gameId}" already exists.`
		}
	}

	let game = makeGame(username, knockingAllowed, lowHighAceAllowed, gameId);
	games[game.id] = game;
	const knockAllowTxt = knockingAllowed ? 'Knocking allowed.' : '';
	const aceAllowTxt = lowHighAceAllowed ? 'Low or high aces allowed.' : '';

	return {
		status: 200,
		gameId: game.id,
		playerId: game.owner.id,
		text: `Game with id "${game.id}" successfully created. ${knockAllowTxt} ${aceAllowTxt}`
	}
}

//for the next two functions, even though they take gameId as an argument they return it
//from the games array (just to make sure everything is lining up)
exports.joinGame = function (username, gameId) {
	const player = games[gameId].addPlayer(username);

	return {
		status: 200,
		gameId: gameId,
		playerId: player.id,
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
		deck: game.cards.deck,
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

exports.depositCard = function (playerId, cardNo) {
	// todo check if player is allowed to deposit this card
	const game = getGameByPlayerId(playerId);
	const player = game.players[playerId];
	const card = player.hand().filter(el => el.char === cardNo)[0]
	return {
		hand: player.depositCard(card)
	}
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
	const scores = {};
	const gameDuration = (game.gameOver ? game.timeStarted - game.timeFinished : game.timeStarted - new Date);
	for (let id in game.players) {
		scores[id] = game.players[id].score;
	}
	return {
		gameId: game.id,
		numPlayers: numPlayers,
		scores: scores,
		round: game.round,
		gameDuration: new Date(gameDuration).toISOString().substr(11, 8)

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
exports.pollGame = function (playerId) {
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
			deck: game.cards.deck,
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