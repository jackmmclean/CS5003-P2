const {users} = require("./data/data");
const {
	shuffle,
	isRun,
	isSet,
	cardScore,
	unmatchedCards,
	getAllPossibleMelds,
	getDistinctRuns,
	sortByCards,
	clearDuplicateCards,
	getGameByPlayerId,
	niceUsername,
	transformCards,
	calculatePlayerScores,
	getHighestScoringPlayers,
	getHighestScoringRoundPlayers
} = require("./utils.js");

const {
	v4: uuidv4
} = require('uuid');

//define a players object
makePlayer = function (username) {
	function Player(username) {
		this.username = username;
		this.id = uuidv4();
		this.melds = null;
		this.score = 0;
		this.roundScore = 0;
	}
	return new Player(username)
}

exports.makeGame = function (username, knockingAllowed, lowHighAceAllowed, roundMode, gameId = '') {
	function Game() {
		this.id = (gameId !== '') ? gameId : uuidv4();
		this.timeStarted = null;
		this.timeFinished = null;
		this.gameOver = false;
		this.round = 1;
		this.messages = [];
		this.players = {};
		// turn order defines the turn order of players as the players object is unordered
		this.turnOrder = [];
		// turnPlayer is index of current turn's player in the turnOrder array
		this.turnPlayerIndex = null;
		// set initially to dummy variable
		this.turnTimer = {
			turnTimer: 10
		};
		// action: which action can currently be performed: can be 'draw', 'deposit'
		this.currentAction = 'draw';
		this.cardHistory = [];
		this.cards = null;
		this.knockingAllowed = knockingAllowed;
		this.highOrLowAces = lowHighAceAllowed;
		this.roundMode = roundMode;
		// owner of the game (the player who created it)
		this.owner = null;

		// skip to the next turn
		this.nextTurn = () => {
			this.turnPlayerIndex = (this.turnPlayerIndex + 1) < this.turnOrder.length ? this.turnPlayerIndex + 1 : 0;
			this.turnTimer.resetTimer(this.turnOrder[this.turnPlayerIndex].id);
		}

		// toggle next action
		this.toggleAction = () => {
			this.currentAction = (this.currentAction === 'draw') ? 'deposit' : 'draw';
		}

		this.endGame = () => {
			this.gameOver = true;
			this.timeFinished = new Date;

			// save the scores of registered users to the overall score
			for (let [, player] of Object.entries(this.players).filter(arr => arr[1].username !== 'guest')) {
				users[player.username].allTimeScore += player.score;
				users[player.username].playedGames ++;
			}

		};
		this.addPlayer = (username, owner = false) => {
			let player = makePlayer(username);
			this.players[player.id] = player;
			if (owner === true) {
				this.owner = player;
			}
			return player;
		};
		// remove a player from the game (e.g. when they don't respond)
		this.removePlayer = (playerId) => {
			let player = this.players[playerId]

			//put players cards back
			this.cards.deck = shuffle([...this.cards.deck, ...player.hand()]);

			// remove from turn order
			this.turnOrder.splice(this.turnOrder.indexOf(player), 1)

			// update turnPlayerIndex if the removed element was the last one in turnPlayer.order
			this.turnPlayerIndex = (this.turnPlayerIndex < this.turnOrder.length) ? this.turnPlayerIndex : 0

			// remove from players
			delete this.players[playerId]
		};
		this.newRound = (nextRoundStartingPlayer) => {
			this.round++;
			this.cards = makeCards(this, this.round);
			if (nextRoundStartingPlayer != null) {
				this.turnPlayerIndex = this.turnOrder.indexOf(nextRoundStartingPlayer);
			}
		};
		this.startGame = () => {
			this.turnTimer = makeTurnTimer(this.owner.id);
			this.timeStarted = new Date;
			this.cards = makeCards(this);
			//allow these functions to be accessed from the player objects
			for (let [k, player] of Object.entries(this.players)) {

				// save the order of the players
				this.turnOrder.push(player);

				player.hand = () => {
					return this.cards[player.id];
				}
				player.openDraw = () => {
					this.cards.openDraw(player)
				};
				player.closedDraw = () => {
					this.cards.closedDraw(player)
				};
				player.depositCard = (card) => {
					return this.cards.depositCard(player, card)
				};
			}

			// set owner as starting player
			this.turnPlayerIndex = this.turnOrder.indexOf(this.owner);
		};
	}
	let game = new Game();
	game.addPlayer(username, true);
	return game;
}

//define function (use of closure) that will create the distribution of cards
function makeCards(game, round) {

	let players = game.players;

	// initialise variables
	var deck = [];
	const ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
	// value of ace is 1 by default but we change this when checking (if high or low aces is toggled)

	const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
	// define invalid cards, for example the 'knights' cards
	const invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
	// define charCodes for regular deck of cards as unicode chars from 127137 to 127198 minus invalidCharCodes
	const charCodes = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));

	//constructor function for cards
	function Card(rank, suit, unicodeChar) {
		this.rank = rank;
		this.suit = suit;
		this.char = unicodeChar;
	}

	for (let suit of suits) {
		for (let rank of ranks) {
			// get the correct unicode character
			let charCode = charCodes[suits.indexOf(suit) * 13 + ranks.indexOf(rank)];
			// instantiate a new cards
			let card = new Card(rank, suit, charCode);
			deck.push(card);
		}
	}

	let numOfPlayers = Object.keys(players).length;

	//if there are 2 players then players get 10 cards, else get 7 cards
	const cardsPerPlayer = (numOfPlayers === 2) ? 10 : 7;

	//define cards object, deck is shuffled deck define before
	let cards = {
		deck: shuffle(deck),
		openDeck: deck.splice(0, 1)
	}

	//assign object attributes that hold each players cards
	for (let [k,] of Object.entries(players)) {
		cards[k] = cards.deck.splice(0, cardsPerPlayer);
	}

	//constructor function for instances of cards, used for
	//storing locations of cards at every point in game
	function CardsInstance(round) {
		this.time = new Date;
		this.round = round;
		this.scores = {};
		this.openDeck = Object.assign({}, transformCards(cards.openDeck));
		this.deck = Object.assign({}, transformCards(cards.deck));
		for (let [k, player] of Object.entries(players)) {
			let usrNm = niceUsername(player.id);
			this[usrNm] = Object.assign({}, transformCards(cards[player.id]));
			// save scores of players at the current state
			this.scores[usrNm] = player.score;
		}
	}

	//define a method for a player to draw from closed deck
	cards.closedDraw = function (player) {
		if (game.currentAction !== 'draw') throw "Disallowed action: draw. Currently allowed " + game.currentAction;
		game.cardHistory.push(new CardsInstance(this.round));
		cards[player.id].push(cards.deck.splice(cards.deck.length - 1, 1)[0]);

		// handle closed deck fully depleted
		if (cards.deck.length === 0) {
			// Shuffle all but the upcard from the open deck and put them back into the deck
			cards.deck.push(...shuffle(cards.openDeck.splice(0, cards.openDeck.length-1)))
		}

		return cards[player.id][cards[player.id].length - 1];
	}

	// define a method for a player to draw from open deck
	cards.openDraw = function (player) {
		if (game.currentAction !== 'draw') throw "Disallowed action: draw. Currently allowed " + game.currentAction;
		game.cardHistory.push(new CardsInstance(this.round));
		cards[player.id].push(cards.openDeck.splice(cards.openDeck.length - 1, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	// define a method for a player to deposit one of their cards onto the open deck
	cards.depositCard = function (player, card) {
		if (game.currentAction !== 'deposit') throw "Disallowed action: deposit. Currently allowed " + game.currentAction;
		game.cardHistory.push(new CardsInstance(this.round));
		cards['openDeck'].push(
			cards[player.id].splice(cards[player.id].indexOf(card), 1)[0]
		);
		return player.hand();
	}

	game.cardHistory.push(new CardsInstance(this.round));
	return cards
}

/**
 * Process what happens when a player declares Gin -> Make Melds and check that declaring player has no remaining cards
 * @param declaringPlayer {Object} The player declaring gin
 * @param game {Object} The current game
 * @returns {Boolean} true if the declared Gin is valid
 * */
const processGinDeclared = function (declaringPlayer, game) {

	// make melds for all players
	for (let [k, player] of Object.entries(game.players)) {
		player.melds = makeMelds(player.hand());
	}

	//assuming that player.melds is an array that contains arrays - eg
	// player.melds = [[card, card, card], [card,card,card]...]

	// confirm that the player truly only has melds and no remaining cards
	for (let meld of declaringPlayer.melds) {
		if (!Array.isArray(meld) || !(isRun(meld, game.highOrLowAces) || isSet(meld))) return false;
	}

	return true;
}

exports.processGinDeclared = (declaringPlayer, game) => {
	return processGinDeclared(declaringPlayer, game)
}

/**
 * Process the knock of a player
 * @param game {Object} current game
 * */
processKnock = function (game) {
	// make the melds for all players
	for (let [k, player] of Object.entries(game.players)) {
		player.melds = makeMelds(player.hand());
	}
}

exports.processKnock = function (game) {
	return processKnock(game)
}

/**
 * Calculate the scores for each player after a player knocked.
 * @param game {Object} The current game
 * @param declaringPlayer {Object} The one who knocks (Walter White)  ... sorry, I could not resist ;-)
 * */
exports.getRoundKnockScores = function (game, declaringPlayer) {

	processKnock(game);
	calculatePlayerScores(game);

	let winners = getHighestScoringRoundPlayers(Object.entries(game.players).map(el => el[1]));

	//if the winner AND some other player(s) have the same knock score then give defenders an extra ??10?? points
	if (winners.includes(declaringPlayer) && winners.length > 1) {
		for (let winner of winners.filter(el => el != declaringPlayer)) {
			winner.score += 10;
		}
		return `Your score tied. To the other winner${winners.length > 2 ? 's' : ''} - an extra 10 points!`
	}

	//if the knocking player does not have the highest score, winner(s) get a bonus 25 points
	else if (!winners.includes(declaringPlayer)) {
		for (let winner of winners) {
			winner.score += 25;
		}
		return `Your knocking score was beaten. To the other winner${winners.length > 2 ? 's' : ''} - an extra 25 points!`
	}

	return 'You had the best knocking score.'


}

//player argument is player who declared gin (correctly)
exports.getRoundGinScores = function (game, declaringPlayer) {

	let isGin = processGinDeclared(declaringPlayer, game);
	calculatePlayerScores(game);

	if (isGin) {
		declaringPlayer.score += 25;
	}
	// Player incorrectly declaring Gin doesn't get any points
	else {
		declaringPlayer.score -= declaringPlayer.roundScore;
	}

}

/**
 * Calculate the best melds for a hand of cards.
 * @param cards {Array<Object>} The players hand, an array of cards.
 * @returns {Array<Array<Object>, Object>} an array containing arrays of cards that represent the possible melds
 * and possibly some 'loose' (not in a second level array) unmatched cards.
 * */
function makeMelds(cards) {
	//define a variable that contains all possible melds from a hand
	let possibleMelds = getAllPossibleMelds(cards);
	//split into the runs and sets
	let possibleRuns = possibleMelds.runs;
	let possibleSets = possibleMelds.sets;

	//find the 'distinct runs', eg we do not want to simultaneously consider '7,8,9' and '8,9,10'
	let distinctRuns = getDistinctRuns(possibleRuns);

	//then we sort each suit property (containing the distinct runs for that suit) by the number of 
	//cards that each set of distinct runs 'uses up'
	for (let suit in distinctRuns) {
		distinctRuns[suit] = sortByCards(distinctRuns[suit]);
	}

	// We have all combinations of distinct runs and we have sets but cards may overlap
	// therefore we need to choose whether to remove from runs or sets
	let returnArray = clearDuplicateCards(distinctRuns, possibleSets);

	// put unmatched cards in (not in an array) 
	// so we have return format like [[some run], [some run], [some set], unmatchedCard, unmatchedCard ...]
	for (let array of returnArray) {
		cards = cards.filter(el => !array.includes(el))
	}
	returnArray.push(...cards)

	return returnArray

}

exports.createMessage = function (playerId, text) {
	const game = getGameByPlayerId(playerId);

	function Message(playerId, text) {
		//we will only display time, but timeStamp is stored as full date for potential future use 
		//eg including user messages with long term scores
		this.id = uuidv4();
		this.niceUsername = niceUsername(playerId);
		this.timeStamp = new Date().toISOString().substr(11, 8);
		this.playerId = playerId;
		this.text = text;
	}
	const message = new Message(playerId, text);
	game.messages.push(message);
	return message
}

makeTurnTimer = function (playerId) {

	const SECONDS_PER_ROUND = 10;

	const game = getGameByPlayerId(playerId);

	let timer = {
		timeLeft: SECONDS_PER_ROUND,
		timerFunction: setInterval(() => {
			if (timer.timeLeft === 0) {
				clearInterval(timer.timerFunction);
				game.removePlayer(playerId);
				// if only one player left, end the game
				if (Object.keys(game.players).length < 2) {
					game.endGame();
				}
			} else {
				timer.timeLeft--;
			}
		}, 1000),
		resetTimer: function (newPlayerId) {
			clearInterval(timer.timerFunction);
			timer.timeLeft = SECONDS_PER_ROUND;
			timer.timerFunction = setInterval(() => {
				if (timer.timeLeft === 0) {
					clearInterval(timer.timerFunction);
					game.removePlayer(newPlayerId);
				} else {
					timer.timeLeft--;
				}
			}, 1000)
		}
	}

	return timer

}