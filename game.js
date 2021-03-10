// is there a syntax for this like 'shuffle, isRun, ...' ???
const {
	shuffle
} = require("./utils");
const {
	isRun
} = require("./utils");
const {
	isSet
} = require("./utils");
const {
	cardScore
} = require("./utils");
const {
	unmatchedCards
} = require("./utils");
const {
	v4: uuidv4
} = require('uuid');


//define a players object
function makePlayers(playerCount) {
	var players = [];
	//player object constructor. We will add access to the card methods in the
	//makeCards function
	function Player() {
		this.username = 'get a username';
		this.id = uuidv4();
		this.melds = null;
		this.score = 0;
	}
	for (let i = 0; i < playerCount; i++) {
		players.push(new Player());
	}
	return players
}

function makeGame(players) {
	function Game(players) {
		this.timeStarted = new Date;
		this.timeFinished = null;
		this.gameOver = false;
		this.round = 1;
		this.players = players;
		this.cardHistory = [];
		this.highOrLowAces = false;
		this.endGame = () => {
			this.gameOver = true;
			this.timeFinished = new Date;
		};
	}
	return new Game(players)
}

//define function (use of closure) that will create the distribution of cards
function makeCards(players, game) {

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
		this.colour = ['Hearts', 'Diamonds'].includes(suit) ? 'red' : 'black'
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
	function cardsInstance() {
		this.time = new Date;
		this.openDeck = Object.assign({}, cards.openDeck);
		this.deck = Object.assign({}, cards.deck);
		for (let player of players) {
			this[player.id] = Object.assign({}, cards[player.id]);
		}
	}

	//define a method for a player to draw from closed deck
	cards.closedDraw = function (player) {
		game.cardHistory.push(new cardsInstance());
		cards[player.id].push(cards.deck.splice(0, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	//define a method for a player to draw from open deck
	cards.openDraw = function (player) {
		game.cardHistory.push(new cardsInstance());
		cards[player.id].push(cards.openDeck.splice(0, 1)[0]);
		return cards[player.id][cards[player.id].length - 1];
	}

	//define a method for a player to deposit one of their cards onto the open deck
	cards.depositCard = function (player, cardNo) {
		game.cardHistory.push(new cardsInstance());
		cards['openDeck'].push(cards[player.id].splice(cardNo, cardNo + 1)[0]);
	}

	//allow these functions to be accessed from the player objects
	for (let player of players) {
		player.hand = () => {
			return cards[player.id];
		}
		player.openDraw = () => {
			cards.openDraw(player)
		};
		player.closedDraw = () => {
			cards.closedDraw(player)
		};
		player.depositCard = (cardNo) => {
			cards.depositCard(player, cardNo)
		};
	}

	return cards
}

//
function processGinDeclared(player) {
	melds = player.melds;
	//assuming that player.melds is an array that contains arrays - eg
	// player.melds = [[card, card, card], [card,card,card]...]

	for (let meld of melds) {
		if (!(isRun(meld, game.highOrLowAces) || isSet(meld))) return false;
	}

	return true;
}

//function to process knock after all players have placed their cards on knocked players matched melds
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