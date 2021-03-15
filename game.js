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
	niceUsername
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
	}
	return new Player(username)
}

exports.makeGame = function (username, knockingAllowed, lowHighAceAllowed, gameId = '') {
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
		// action: which action can currently be performed: can be 'draw', 'deposit'
		this.currentAction = 'draw';
		this.cardHistory = [];
		this.cards = null;
		this.knockingAllowed = knockingAllowed;
		this.highOrLowAces = lowHighAceAllowed;
		// owner of the game (the player who created it)
		this.owner = null;

		// skip to the next turn
		this.nextTurn = () => {
			this.turnPlayerIndex = (this.turnPlayerIndex + 1) < this.turnOrder.length ? this.turnPlayerIndex + 1 : 0
		}

		// toggle next action
		this.toggleAction = () => {
			this.currentAction = (this.currentAction === 'draw') ? 'deposit' : 'draw';
		}

		this.endGame = () => {
			this.gameOver = true;
			this.timeFinished = new Date;
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

			// remove from turn order
			this.turnOrder.splice(this.turnOrder.indexOf(player),  1)

			// update turnPlayerIndex if the removed element was the last one in turnPlayer.order
			// todo check that this works properly
			this.turnPlayerIndex = (this.turnPlayerIndex < this.turnOrder.length) ? this.turnPlayerIndex : 0

			// remove from players
			delete this.players[playerId]
		}
		this.startGame = () => {
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
function makeCards(game) {

	let players = game.players;

	//initialise variables
	var deck = [];
	const ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
	//value of ace is 1 by default but we change this when checking (if high or low aces is toggled)

	const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
	//define invalid cards, for example the 'knights' cards
	const invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
	//define charCodes for regular deck of cards as unicode chars from 127137 to 127198 minus invalidCharCodes
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
		openDeck: deck.splice(0, 1),
		deck: shuffle(deck)
	}

	//assign object attributes that hold each players cards
	for (let [k, v] of Object.entries(players)) {
		cards[k] = cards.deck.splice(0, cardsPerPlayer);
	}

	//constructor function for instances of cards, used for
	//storing locations of cards at every point in game
	function CardsInstance() {
		this.time = new Date;
		this.openDeck = Object.assign({}, cards.openDeck);
		this.deck = Object.assign({}, cards.deck);
		for (let [k, player] of Object.entries(players)) {
			this[player.id] = Object.assign({}, cards[player.id]);
		}
	}

	//define a method for a player to draw from closed deck
	cards.closedDraw = function (player) {
		game.cardHistory.push(new CardsInstance());
		cards[player.id].push(cards.deck.splice(cards.deck.length - 1, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	//define a method for a player to draw from open deck
	cards.openDraw = function (player) {
		game.cardHistory.push(new CardsInstance());
		cards[player.id].push(cards.openDeck.splice(cards.openDeck.length - 1, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	//define a method for a player to deposit one of their cards onto the open deck
	cards.depositCard = function (player, card) {
		game.cardHistory.push(new CardsInstance());
		cards['openDeck'].push(
			cards[player.id].splice(cards[player.id].indexOf(card), 1)[0]
		);
		return player.hand();
	}

	return cards
}

/**
 * Process what happens when a player declares Gin -> Make Melds and check that declaring player has no remaining cards
 * @param declaringPlayer {Object} The player declaring gin
 * @param game {Object} The current game
 * @returns {Boolean} true if the declared Gin is valid
 * */
exports.processGinDeclared = function (declaringPlayer, game) {

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

/**
 * Process the knock of a player
 * @param game {Object} current game
 * */
exports.processKnock = function (game) {
	// make the melds for all players
	for (let [k, player] of Object.entries(game.players)) {
		player.melds = makeMelds(player.hand());
	}
}

/**
 * Calculate the scores for each player after a player knocked.
 * @param game {Object} The current game
 * @param declaringPlayer {Object} The one who knocks (Walter White)  ... sorry, I could not resist ;-)
 * */
exports.getRoundKnockScores = function (game, declaringPlayer) {
	let players = game.players;
	// assuming that player.melds is an array as above but that all unmatched
	// cards are loose in the array eg for cards 7-9 unmatched
	// player.melds = [[card1,card2,card3],[card4,card5,card,card6], card7, card8, card9]

	//add up the score of all players and store in opponentScores
	let opponentScores = 0;
	for (let [k, player] of Object.entries(players)) {
		player.score = unmatchedCards(player.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0);
		opponentScores += player.score;
	}

	//declaring player's round score is value of all opponents cards minus their own - therefore opponentScores minus
	//double their own scores
	declaringPlayer.score += (opponentScores - 2 * unmatchedCards(declaringPlayer.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0))
}

//player argument is player who declared gin (correctly)
exports.getRoundGinScores = function (game, declaringPlayer) {
	let players = game.players;
	//add up the score of all players and store in opponentScores
	let opponentScores = 0;
	for (let [k, player] of Object.entries(players)) {
		player.score = unmatchedCards(player.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0);
		opponentScores += player.score;
	}

	//the players score is the value of opponents cards plus 20 points
	declaringPlayer.score += (opponentScores - unmatchedCards(declaringPlayer.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0) + 20)
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

let cardTest = [{
	rank: 'Q',
	suit: 'Clubs'
}, {
	rank: 10,
	suit: 'Hearts'
}, {
	rank: 9,
	suit: 'Clubs'
}, {
	rank: 'J',
	suit: 'Clubs'
}, {
	rank: 10,
	suit: 'Clubs'
}, {
	rank: 7,
	suit: 'Clubs'
}, {
	rank: 8,
	suit: 'Clubs'
}, {
	rank: 10,
	suit: 'Diamonds'
}, {
	rank: 10,
	suit: 'Spades'
}]