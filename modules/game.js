// import {shuffle} from "./utils.js"

//define function (use of closure) that will create the distribution of cards
function makeCards(players) {

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
	for (let i = 0; i < numOfPlayers; i++) {
		cards[players[i]] = cards.deck.splice(0, cardsPerPlayer);
	}

	//define a method for a player to draw from closed deck
	cards.closedDraw = function (player) {
		cards[player].push(cards.deck.splice(0, 1));
		return cards[player][cards[player].length - 1];
	}

	//define a method for a player to draw from open deck
	cards.openDraw = function (player) {
		cards[player].push(cards.openDeck.splice(0, 1));
		return cards[player][cards[player].length - 1];
	}

	//define a method for a player to deposit one of their cards onto the open deck
	cards.depositCard = function (player, cardNo) {
		cards['openDeck'].push(cards[player].splice(cardNo, cardNo + 1)[0]);
	}

	return cards

}