const {
	shuffle,
	isRun,
	isSet,
	cardScore,
	unmatchedCards,
	getAllPossibleMelds,
	getDistinctRuns,
	sortByCards,
	clearDuplicateCards
} = require("./utils.js");

const {
	v4: uuidv4
} = require('uuid');

//define a players object
function makePlayer(username) {

	function Player() {
		this.username = 'get a username';
		this.id = uuidv4();
		this.melds = null;
		this.score = 0;
	}

	return new Player(username)
}

exports.makeGame = function (player, knockingAllowed, lowHighAceAllowed) {
	function Game(player) {
		this.id = uuidv4();
		this.timeStarted = null;
		this.timeFinished = null;
		this.gameOver = false;
		this.round = 1;
		this.players = [player];
		this.cardHistory = [];
		this.cards = null;
		this.knockingAllowed = knockingAllowed;
		this.highOrLowAces = lowHighAceAllowed;
		this.endGame = () => {
			this.gameOver = true;
			this.timeFinished = new Date;
		};
		this.addPlayer = (player) => {
			this.players.push(player);

		};
		this.startGame = () => {
			this.timeStarted = new Date;
			this.cards = makeCards(this);
			//allow these functions to be accessed from the player objects
			for (let player of this.players) {
				player.hand = () => {
					return this.cards[player.id];
				}
				player.openDraw = () => {
					this.cards.openDraw(player)
				};
				player.closedDraw = () => {
					this.cards.closedDraw(player)
				};
				player.depositCard = (cardNo) => {
					this.cards.depositCard(player, cardNo)
				};
			}
		};
	}
	return new Game(player)
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
		this.char = String.fromCharCode(unicodeChar);
	}

	for (let suit of suits) {
		charCode = charCodes[suits.indexOf(suit)];
		for (let rank of ranks) {
			let card = new Card(rank, suit, charCode);
			deck.push(card);
		}
	}

	let numOfPlayers = players.length;

	//if there are 2 players then players get 10 cards, else get 7 cards
	cardsPerPlayer = (numOfPlayers === 2) ? 10 : 7;

	//define cards object, deck is shuffled deck define before
	cards = {
		openDeck: deck.splice(0, 1),
		deck: shuffle(deck)
	}

	//assign object attributes that hold each players cards
	for (let player of players) {
		cards[player.id] = cards.deck.splice(0, cardsPerPlayer);
	}

	//constructor function for instances of cards, used for
	//storing locations of cards at every point in game
	function CardsInstance() {
		this.time = new Date;
		this.openDeck = Object.assign({}, cards.openDeck);
		this.deck = Object.assign({}, cards.deck);
		for (let player of players) {
			this[player.id] = Object.assign({}, cards[player.id]);
		}
	}

	//define a method for a player to draw from closed deck
	cards.closedDraw = function (player) {
		game.cardHistory.push(new CardsInstance());
		cards[player.id].push(cards.deck.splice(0, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	//define a method for a player to draw from open deck
	cards.openDraw = function (player) {
		game.cardHistory.push(new CardsInstance());
		cards[player.id].push(cards.openDeck.splice(0, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	//define a method for a player to deposit one of their cards onto the open deck
	cards.depositCard = function (player, cardNo) {
		game.cardHistory.push(new CardsInstance());
		cards['openDeck'].push(cards[player.id].splice(cardNo, cardNo + 1)[0]);
		return player.hand();
	}

	return cards
}

function processGinDeclared(player) {
	melds = makeMelds(player.hand());
	//assuming that player.melds is an array that contains arrays - eg
	// player.melds = [[card, card, card], [card,card,card]...]

	for (let meld of melds) {
		if (!(isRun(meld, game.highOrLowAces) || isSet(meld))) return false;
	}

	return true;
}

//function to process knock score
function getRoundKnockScores(players, declaringPlayer) {
	//assuming that player.melds is an array as above but that all unmatched
	//cards are loose in the array eg for cards 7-9 unmatched
	//  player.melds = [[card1,card2,card3],[card4,card5,card,card6], card7, card8, card9]

	//add up the score of all players and store in opponentScores
	let opponentScores;
	for (let player of players) {
		opponentScores += unmatchedCards(player.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0);
	}

	//declaring player's round score is value of all opponents cards minus their own - therefore opponentScores minus
	//double their own scores
	declaringPlayer.score += (opponentScores - 2 * unmatchedCards(declaringPlayer.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0))

}

//player argument is player who declared gin
function getRoundGinScores(players, declaringPlayer) {
	//add up the score of all players and store in opponentScores
	let opponentScores;
	for (let player of players) {
		opponentScores += unmatchedCards(player.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0);
	}

	//the players score is the value of opponents cards plus 20 points
	declaringPlayer.score += (opponentScores - unmatchedCards(declaringPlayer.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0) + 20)
}

function makeMelds(cards) {
	let possibleMelds = getAllPossibleMelds(cards);
	let possibleRuns = possibleMelds.runs;
	let possibleSets = possibleMelds.sets;

	distinctRuns = getDistinctRuns(possibleRuns);

	for (let suit in distinctRuns) {
		distinctRuns[suit] = sortByCards(distinctRuns[suit]);
	}

	//we have all combinations of distinct runs and we have sets but cards may overlap
	//therefore we need to choose whether to remove from runs or sets
	let returnArray = clearDuplicateCards(distinctRuns, possibleSets);

	//put unmatched cars in, not in an array
	for (let array of returnArray) {
		cards = cards.filter(el => !array.includes(el))
	}
	returnArray.push(...cards)

	return returnArray
	//need to review this - unsure if we need to consider the best possible way to determine which to choose

}

testCards = [{
	rank: 2,
	suit: 'Diamonds'
}, {
	rank: 3,
	suit: 'Diamonds'
}, {
	rank: 4,
	suit: 'Diamonds'
}, {
	rank: 6,
	suit: 'Diamonds'
}, {
	rank: 7,
	suit: 'Diamonds'
}, {
	rank: 8,
	suit: 'Diamonds'
}, {
	rank: 9,
	suit: 'Diamonds'
}, {
	rank: 'A',
	suit: 'Diamonds'
}, {
	rank: 'A',
	suit: 'Hearts'
}, {
	rank: 'A',
	suit: 'Clubs'
}]

testCards2 = [{
	rank: 2,
	suit: 'Diamonds'
}, {
	rank: 3,
	suit: 'Diamonds'
}, {
	rank: 4,
	suit: 'Diamonds'
}, {
	rank: 6,
	suit: 'Hearts'
}, {
	rank: 7,
	suit: 'Hearts'
}, {
	rank: 8,
	suit: 'Hearts'
}, {
	rank: 9,
	suit: 'Diamonds'
}, {
	rank: 'A',
	suit: 'Diamonds'
}, {
	rank: 'A',
	suit: 'Hearts'
}, {
	rank: 'A',
	suit: 'Clubs'
}]