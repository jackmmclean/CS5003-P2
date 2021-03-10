// define function to shuffle cards
exports.shuffle = function (array) {

	var currentIndex = array.length,
		temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

function cardValue(card, highAce = false) {
	const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
	const ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
	let value = values[ranks.indexOf(card.rank)];
	if (value === 1 && highAce) {
		return 14;
	} else {
		return value;
	}
}

// define function to sort by card value
exports.sortByValue = function (arrayCards, highAce = false) {

	function compareValue(a, b) {
		if (cardValue(a, highAce) < cardValue(b, highAce)) {
			return -1;
		}
		if (cardValue(a, highAce) > cardValue(b, highAce)) {
			return 1;
		}
		return 0;
	}
	return arrayCards.sort(compareValue);
}

exports.isSet = function (cardArray) {
	if (cardArray.length < 3) return false;
	for (let i = 0; i < cardArray.length - 1; i++) {
		if (cardArray[i].rank !== cardArray[i + 1].rank) return false;
	}
	return true;
}

exports.isRun = function (cardArray, highOrLowAces) {
	//check at that the meld is at least 3 cards
	if (cardArray.length < 3) return false;

	//check suits are all the same
	for (let i = 0; i < cardArray.length - 1; i++) {
		if (cardArray[i].suit !== cardArray[i + 1].suit) return false;
	}

	//initialise a boolean variable that will tell us whether it is a run or not
	let isRunBool = true;

	//check that the cards are in a run -
	//first we check with low aces
	cardArray = sortByValue(cardArray);
	for (let i = 0; i < cardArray.length - 1; i++) {
		if (cardArray[i + 1].value !== (cardArray[i].value + 1)) {
			isRunBool = false;
		}
	}

	// if it was a run for low aces then return true
	if (isRunBool) {
		return true;
	}

	//otherwise, if highOrLowAces is true then check for a run with high aces
	else if (highOrLowAces) {
		cardArray = sortByValue(cardArray, true);
		for (let i = 0; i < cardArray.length - 1; i++) {
			if (cardArray[i + 1].value !== (cardArray[i].value + 1)) return false;
		}
	}

	return true;
}

exports.cardScore = function (card) {
	if (!isNaN(card.rank)) {
		return card.rank;
	} else if (card.rank === 'A') {
		return 1;
	} else return 10;
}

exports.unmatchedCards = function (meldsArray) {
	var unmatchedCards = [];
	for (let entry of meldsArray) {
		if (!Array.isArray(entry)) {
			unmatchedCards.push(entry)
		}
	}
	return unmatchedCards;
}