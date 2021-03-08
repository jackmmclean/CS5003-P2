var cards = []
const ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
const charCodes = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => invalidCharCodes.indexOf(el) === -1);

function Card(rank, suit, unicodeChar) {
	this.rank = rank;
	this.suit = suit;
	this.char = String.fromCharCode(unicodeChar);
}

for (let suit of suits) {
	let charCode = 127153;
	for (let rank of ranks) {
		let card = new Card(rank, suit, charCode);
		cards.push(card);
		charCode++;
	}
}