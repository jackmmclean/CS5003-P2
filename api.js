const {
	getRoundKnockScores,
	processKnock
} = require("./game");
const {
	users,
	games
} = require('./data/data')
const {
	makeGame,
	makePlayer,
	processGinDeclared,
	getRoundGinScores,
	createMessage
} = require('./game')
const {
	getGameByPlayerId,
	getHighestScoringPlayers,
	niceUsername,
	playerInGameCardInstance
} = require('./utils')


exports.createGame = function (username, knockingAllowed, lowHighAceAllowed, roundMode, gameId = '') {

	gameId = gameId.trim();

	if (games.hasOwnProperty(gameId)) {

		return {
			status: 409,
			gameId: gameId,
			text: `Could not create game. Game with id "${gameId}" already exists.`
		}
	}

	let game = makeGame(username, knockingAllowed, lowHighAceAllowed, roundMode, gameId);
	games[game.id] = game;
	const knockAllowTxt = knockingAllowed ? 'Knocking allowed.' : '';
	const aceAllowTxt = lowHighAceAllowed ? 'Low or high aces allowed.' : '';
	const roundModeTxt = roundMode ? 'Round mode on.' : '';

	return {
		status: 200,
		gameId: game.id,
		playerId: game.owner.id,
		text: `Game with id "${game.id}" successfully created. ${knockAllowTxt} ${aceAllowTxt} ${roundModeTxt}`
	}
}

//for the next two functions, even though they take gameId as an argument they return it
//from the games array (just to make sure everything is lining up)
exports.joinGame = function (username, gameId) {
	// process game that's already started
	if (games[gameId].timeStarted !== null) {
		return {
			status: 405,
			text: "This game has already started"
		}
	}
	// process full game
	else if (Object.keys(games[gameId].players).length >= 4) {
		return {
			status: 405,
			text: "This game is already full.",
		}
	}
	// everything ok
	else {
		const player = games[gameId].addPlayer(username);
		return {
			status: 200,
			gameId: gameId,
			playerId: player.id,
			text: `Successfully joined game with id ${gameId}.`,
		}
	}
}

exports.startGame = function (playerId) {
	let game = getGameByPlayerId(playerId)
	if (game.owner.id !== playerId) {
		return {
			status: 405,
			text: "Only the owner of the game can start the game."
		};
	}

	if (Object.keys(game.players).length < 2) {
		return {
			status: 405,
			text: "Please wait for other players to join."
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
	// return games that haven't started yet and have less than 4 players
	const openGames = Object.entries(games).filter(arr => (
		arr[1].timeStarted === null) && (Object.keys(arr[1].players).length < 4))
	return openGames.map((arr) => {
		let obj = {};
		obj['id'] = arr[0];
		obj['numPlayers'] = Object.keys(arr[1].players).length;
		return obj
	})
}

exports.drawOpenCard = function (playerId) {
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let card = player.openDraw();
	// set action to 'deposit'
	game.toggleAction();
	return {
		drawnCard: card,
		hand: player.hand(),
	};
}

exports.drawClosedCard = function (playerId) {
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	let card = player.closedDraw();
	// set action to 'deposit'
	game.toggleAction();
	return {
		drawnCard: card,
		hand: player.hand(),
		status: 200,
	};
}

exports.depositCard = function (playerId, cardNo) {
	const game = getGameByPlayerId(playerId);
	const player = game.players[playerId];
	const card = player.hand().filter(el => el.char === cardNo)
	if (card.length !== 1) {
		return {
			status: 405,
			text: 'Depositing this card is not allowed.'
		}
	} else {
		const hand = player.depositCard(card[0]);
		// set action to 'draw'
		game.toggleAction();
		// skip to next turn;
		game.nextTurn();
		return {
			status: 200,
			status: 200,
			hand: hand,
			text: 'Deposited card'
		}
	}
}

/**
 * Assemble information that's sent back to the user when they declare a gin and end the game if the declared Gin
 * is appropriate/
 * @param playerId {string} ID of the declaring player
 * @returns {Object} information sent back to the user
 * */
exports.declareGin = function (playerId) {
	let status, text, winners;
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	const validGin = processGinDeclared(player, game)

	getRoundGinScores(game, player);
	const highestScorers = getHighestScoringPlayers(Object.entries(game.players).map(arr => arr[1]))
	//if not round mode or a player has a score of 100+
	if (!game.roundMode || (Object.entries(game.players).filter(el => el[1].score >= 100)).length > 0) {
		game.endGame();
		text = validGin ? "Game is over." : "You incorrectly declared Gin.\nYou score zero!"
		winners = highestScorers.length
	} else {
		game.newRound(highestScorers.length > 0 ? highestScorers[0] : null);
		game.turnTimer.resetTimer(playerId);
		winners = null;
		text = validGin ? "Round is over." : "You incorrectly declared Gin.\nYou score zero for this round!"
	}

	return {
		status: 200,
		text: text,
		winners: winners
	};
}

/**
 * Assemble information that's sent back to the user when they knocks and end the game if knocking is
 * is appropriate/
 * @param playerId {string} ID of the knocking player
 * @returns {Object} information sent back to the user
 * */
exports.knock = function (playerId) {
	let status, text, winners;
	let game = getGameByPlayerId(playerId);
	let player = game.players[playerId];
	processKnock(game);
	let resp = getRoundKnockScores(game, player);

	const highestScorers = getHighestScoringPlayers(Object.entries(game.players).map(arr => arr[1]));

	//if not round mode or a player has a score of 100+
	if (!game.roundMode || ((((Object.entries(game.players)).filter(el => el[1].score >= 100)).length) > 0)) {
		game.endGame();
		text = "Game is over." + resp;
		winners = highestScorers.length
	} else {
		game.newRound(highestScorers.length > 0 ? highestScorers[0] : null);
		game.turnTimer.resetTimer(playerId);
		winners = null;
		text = resp;
	}

	return {
		status: 200,
		text: text,
		winners: winners
	};
}


/**
 * Get info about the game.
 * @param playerId {string} Id of the requesting player
 * @returns {Object} Game stats
 * */
exports.gameStats = function (playerId) {

	const game = getGameByPlayerId(playerId);

	// if the player is not in a game, they have been timed out
	if (game === undefined) {
		return {
			status: 408
		}
	}

	const numPlayers = Object.keys(game.players).length;
	const scores = {};
	const gameDuration = (game.gameOver ? game.timeStarted - game.timeFinished : game.timeStarted - new Date);
	for (let id in game.players) {
		scores[id] = game.players[id].score;
	}
	const niceUsernames = {};
	for (let id in game.players) {
		niceUsernames[id] = niceUsername(id);
	}

	const player = game.players[playerId];

	return {
		status: 200,
		gameId: game.id,
		niceUsername: niceUsername(playerId),
		playedGames: player.username === 'guest' ? 0 : users[player.username].playedGames,
		allTimeScore: player.username === 'guest' ? 0 : users[player.username].allTimeScore,
		numPlayers: numPlayers,
		scores: scores,
		gameDuration: new Date(gameDuration).toISOString().substr(11, 8),
		messageCount: game.messages.length,
		cardHistory: game.cardHistory,
		round: game.round,
		turnTimeLeft: game.turnTimer.timeLeft,
		niceUsernames: niceUsernames,
		removed: false
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
			score: 0,
			role: 'user',
			playedGames: 0,
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
		status: 200,
		playerId: player.id
	};
}

/**
 * Collect data that is returned to the client on each poll request.
 * @params playerId {string} the player ID
 * */
exports.pollGame = function (playerId) {
	const game = getGameByPlayerId(playerId);

	// if no game is found (player has been removed/timed out)
	if (game === undefined) {
		return {
			status: 200,
			removed: true,
			text: 'You were removed for inactivity.'
		}
	}

	const scores = Object.entries(game.players).map(el => [el[0], el[1].score]);
	return {
		status: 200,
		gameHasStarted: game.timeStarted !== null,
		scores: scores,
		gameHasFinished: game.timeFinished !== null,
		isOwner: game.owner.id === playerId,
		numPlayers: game.players.length,
		knockingAllowed: game.knockingAllowed,
		roundMode: game.roundMode,
		playerNames: game.turnOrder.map(el => niceUsername(el.id)),
		turnPlayerIndex: game.turnPlayerIndex,
		winner: game.winner,
		removed: false
	}
}

exports.getCards = function (playerId) {
	const game = getGameByPlayerId(playerId);
	// check if game has started
	if (game.timeStarted !== null) {
		return {
			status: 200,
			hand: game.players[playerId].hand(),
			openDeck: game.cards.openDeck,
			deck: game.cards.deck,
		}
	} else {
		return {
			status: 400
		}
	}
}

exports.getScore = function (username) {
	return {
		status: 200,
		score: users[username].score
	};
}

exports.getMessages = function (gameId) {
	if (games.hasOwnProperty(gameId)) {

		return {
			status: 200,
			messages: games[gameId].messages
		}
	} else {
		return {
			status: 409,
			text: `Game with ID "${gameId}" not found.`
		}
	}

}

exports.sendMessage = function (playerId, text) {
	if (text.length === 0) {
		return {
			status: 409,
			text: 'Cannot send empty message.'
		}
	} else if (getGameByPlayerId(playerId) == undefined) {
		return {
			status: 409,
			text: `Cannot find game containing player with player ID "${playerId}".`
		}
	} else {
		const message = createMessage(playerId, text)
		return {
			status: 200,
			text: `Message posted to game with game ID "${getGameByPlayerId(playerId).id}"`,
			message: message
		}
	}
}

/**
 * Validate that a requested user action is permitted for the requesting player.
 * @param {string} playerId: The requesting player
 * @param {string} requestedAction: The requested action
 * @param {}
 * */
exports.validateAction = function (playerId, requestedAction) {
	let game = getGameByPlayerId(playerId)

	// check if it's the player's turn
	if (game.turnOrder[game.turnPlayerIndex].id !== playerId) {
		return {
			status: 405,
			text: "Please wait for your turn."
		}
	}

	// check if the player can perform the requested action
	else if (
		// can't do action if action is neither game.currentAction NOR 'declare' NOR 'knock'
		((game.currentAction !== requestedAction) && (requestedAction !== 'declare') && (requestedAction !== 'knock')) ||
		// can't declare after drawing
		((requestedAction === 'declare') && (game.currentAction === 'deposit')) ||
		// can't knock after drawing
		((requestedAction === 'knock') && (game.currentAction === 'deposit'))
	) {
		return {
			status: 405,
			text: "You can't " + requestedAction + " right now."
		}
	} else {
		return {
			status: 200
		}
	}
}


exports.deletePlayer = function (playerId) {
	const game = getGameByPlayerId(playerId);
	if (game === undefined) {
		return {
			status: 400,
			text: "Cannot find game associated with this player."
		}
	} else {
		game.removePlayer(playerId);
		return {
			status: 200,
			text: `Player with ID ${playerId} removed from game with ID ${game.id}.`
		}
	}
}

// exports.newRound = function (playerId) {
//
// 	if (getGameByPlayerId(playerId) == undefined) {
// 		return {
// 			status: 409,
// 			text: `Cannot find game containing player with player ID "${playerId}".`
// 		}
// 	} else {
// 		const game = getGameByPlayerId(playerId);
// 		game.newRound();
// 		return {
// 			status: 200,
// 			text: `New cards for game ID "${getGameByPlayerId(playerId).id}"`
// 		}
// 	}
//
// }