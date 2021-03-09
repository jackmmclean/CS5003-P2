const {
	shuffle
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
		this.openDeck = cards.openDeck;
		this.deck = cards.deck;
		for (let player of players) {
			this[player.id] = cards[player.id];
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

players = makePlayers(3);
game = makeGame(players);
cards = makeCards(players, game);

//having a scoping (maybe) problem with updating history, will resolve later

players[0].depositCard(0)

players[0].depositCard(0)

players[0].depositCard(0)

for (let instance of game.cardHistory) {
	console.log(instance[players[0].id])
}