const {
	games
} = require("./data/data");

/**
 * Shuffle elements in an array. Implements Fisher-Yates Shuffle.
 * Attribution: https://bost.ocks.org/mike/shuffle/
 * @param array {Array} The array to be shuffled
 * @returns {Array} The shuffled array
 * */
exports.shuffle = function (array) {

	let currentIndex = array.length,
		temporaryValue, randomIndex;

	// While there remain elements to shuffle
	while (0 !== currentIndex) {

		// Select next remaining element and reduce number of remaining
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// Swap the element and the last element in-place
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

/**
 * Calculate the value of a card.
 * @param card {Object} A card object
 * @param highAce {Boolean} whether Aces are high
 * @return {Number} Value of the card
 * */
cardValue = function cardValue(card, highAce = false) {
	const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
	const ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
	let value = values[ranks.indexOf(card.rank)];
	if (value === 1 && highAce) {
		return 14;
	} else {
		return value;
	}
}

/**
 * Sort the cards by value.
 * @param arrayCards {Array} array of cards to sort
 * @param highAce {Boolean} whether Aces are high
 * @return {Array} sorted cards
 * */
sortByValue = function (arrayCards, highAce = false) {

	function compareValue(a, b) {
		if (cardValue(a, highAce) < cardValue(b, highAce)) {
			return -1;
		}
		if (cardValue(a, highAce) > cardValue(b, highAce)) {
			return 1;
		}
		return 0;
	}
	return [].slice.call(arrayCards).sort(compareValue);
}

/**
 * Evaluate whether an array of cards is a set.
 * @param cardArray {Array} an array of cards to check.
 * @returns {Boolean} true if the array is a set, else false.
 * */
exports.isSet = function (cardArray) {
	if (cardArray.length < 3) return false;
	for (let i = 0; i < cardArray.length - 1; i++) {
		if (cardArray[i].rank !== cardArray[i + 1].rank) return false;
	}
	return true;
}

exports.isRun = (cardArray, highOrLowAces) => isRun(cardArray, highOrLowAces);

/**
 * Evaluate whether an array of cards is a run.
 * @param cardArray {Array} an array of cards to check.
 * @returns {Boolean} true if the array is a run, else false.
 * */
isRun = function (cardArray, highOrLowAces) {
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
		if (cardValue(cardArray[i + 1]) !== (cardValue(cardArray[i]) + 1)) {
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
			if (cardValue(cardArray[i + 1], true) !== (cardValue(cardArray[i], true) + 1)) return false;
		}
	}

	//if we get here then it wasnt a run for either ace value
	return false;
}

/**
 * Get the score of a card.
 * @param card {Object} the card whose score to get.
 * @return {Number} the score of the card
 * */
exports.cardScore = function (card) {
	if (!isNaN(card.rank)) {
		return parseInt(card.rank);
	} else if (card.rank === 'A') {
		return 1;
	} else return 10;
}

exports.unmatchedCards = function (meldsArray) {
	let unmatchedCards = [];
	for (let entry of meldsArray) {
		if (!Array.isArray(entry)) {
			unmatchedCards.push(entry)
		}
	}
	return unmatchedCards;
}



categoriseCards = function (cards) {
	let counts = {};
	for (let card of cards) {
		if (counts[card.rank] === undefined) {
			counts[card.rank] = [card]
		} else {
			counts[card.rank].push(card)
		}
		if (counts[card.suit] === undefined) {
			counts[card.suit] = [card]
		} else {
			counts[card.suit].push(card)
		}
	}
	return counts
}

//given an array of cards with matching suit, will return array of arrays with all possible runs
getPossibleRuns = function (cards, highOrLowAce = false) {
	let possibleRuns = [];
	//sort categories, low ace
	let currentCards = sortByValue(cards);
	//if we allow high or low aces and there is an ace, simple attach the ace
	//to the end to check for both possibilities
	if (highOrLowAce && currentCards[0] === 'A') {
		currentCards[currentCards.length] = currentCards[0];
	}

	//try to find runs starting at largest possible
	for (let i = currentCards.length; i > 2; i--) {
		for (let j = 0; j < currentCards.length; j++) {
			if (currentCards.slice(j, j + i).length < i) break;
			if (isRun(currentCards.slice(j, j + i))) {
				possibleRuns.push(currentCards.slice(j, j + i))
			};
		}
	}

	return possibleRuns

}

/**
 * Return all possible melds of cards.
 * @param cards {array}: cards to be checked
 * @returns {Object} object containing two k-v pairs
 * 		- sets: Object with the identifying card value as key and the cards constituting the meld in an array as value
 * 		- runs: Object with the identifying suit as key and each run in an array of arrays as the value
 * 		- e.g. {
 * 				sets: {Q: [card, card, card]},
 * 				runs: {Spades: [[card, card, card], [card, card, card]]}
 * 				}
 * */
exports.getAllPossibleMelds = function (cards) {
	//get an object that categorises cards into ranks and suits
	let categories = categoriseCards(cards);
	//delete all categories not big enough to be a possible meld
	for (let category in categories) {
		if (categories[category].length < 3) {
			delete categories[category];
		}
	}

	var allPossibleMelds = {};
	allPossibleMelds.sets = {};
	allPossibleMelds.runs = {};

	const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

	//for each category, if the category is a rank and there are >2
	//then it is a possible meld
	for (let category in categories) {
		//take sets melds
		if (ranks.includes(category)) {
			allPossibleMelds.sets[category] = (categories[category])
		}
		//take run melds
		else {
			if (getPossibleRuns(categories[category]).length != 0) {
				allPossibleMelds.runs[category] = (getPossibleRuns(categories[category]));
			}
		}
	}
	return allPossibleMelds
}

//for a single suit, check if two runs are distinct ie do not share cards
arraysDistinct = function (runA, runB) {
	let crossoverCards = runA.filter(el => runB.includes(el));
	return (crossoverCards.length === 0);
}

/**
 * Get distinct runs from all possible runs with possible duplicates
 * @param possibleRuns {Object} suits as keys, array of arrays as values
 * @returns {Object} suits as keys, array of arrays as values,
 * 		e.g. {Spades: [[card, card, card], [card, card, card]]}
 * */
exports.getDistinctRuns = function (possibleRuns) {
	let distinctRuns = {};
	for (let suit in possibleRuns) {
		distinctRuns[suit] = [];
		for (let i = 0; i < possibleRuns[suit].length; i++) {
			let thisCombo = [possibleRuns[suit][i]];
			for (let j = i + 1; j < possibleRuns[suit].length; j++) {
				if (arraysDistinct(possibleRuns[suit][i], possibleRuns[suit][j])) {
					thisCombo.push(possibleRuns[suit][j]);
					//account for possibility of third distinct run. 4 not possible since minimum length 3, max cards always < 4*3
					for (let k = j + 1; k < possibleRuns[suit].length; k++) {
						if (arraysDistinct(possibleRuns[suit][k], possibleRuns[suit][j]) && arraysDistinct(possibleRuns[suit][k], possibleRuns[suit][i])) {
							j++
							thisCombo.push(possibleRuns[suit][k]);
							break
						}
					}
					break
				}
			}
			distinctRuns[suit].push(thisCombo);
		}

	}
	return distinctRuns
}


// define function to sort by number of cards in array type [[[card,card],[card,card,card.]..],[card,..]..]
exports.sortByCards = function (cardsArrayOfArraysOfArrays) {

	let cardCount = function (arrayOfArrays) {
		let cardCounts = 0;
		for (let array of arrayOfArrays) {
			cardCounts += array.length;
		}
		return cardCounts;
	}

	function compareValue(a, b) {
		if (cardCount(a) < cardCount(b)) {
			return 1;
		}
		if (cardCount(a) > cardCount(b)) {
			return -1;
		}
		return 0;
	}
	return [].slice.call(cardsArrayOfArraysOfArrays).sort(compareValue);
}

overlappingCards = function (distinctRunsArray, setArray) {
	let overlappingCardArray = [];
	for (let array of distinctRunsArray) {
		for (let card of array) {
			if (setArray.includes(card)) {
				overlappingCardArray.push(card);
			}
		}
	}
	return overlappingCardArray
}

/**
 * Remove either set or run if one of the cards in them is present in both.
 * @param distinctRuns {Object} suits as keys, array of arrays as values
 * @param possibleSets {Object} card value as keys, array of arrays as values
 * @returns {Array.<Array>} array of arrays with all melds
 * */
exports.clearDuplicateCards = function (distinctRuns, possibleSets) {
	let distRunChoice = 0;

	// todo there still seems to be an issue if a card is included in both a set and a run (see Teams 14/03 ~ 12:00)

	// for every run we check it against the sets for overlapping cards
	for (let suit in distinctRuns) {
		for (let rank in possibleSets) {
			// if it has overlapping cards we remove them
			let overlappingCardsArray = overlappingCards(distinctRuns[suit][distRunChoice], possibleSets[rank]);
			if (overlappingCardsArray.length > 0) {
				for (let overlappingCard of overlappingCardsArray) {
					for (let run of distinctRuns[suit][distRunChoice]) {
						if ((run.length > 3) && run.indexOf(overlappingCard !== -1) && isRun(run.filter(el => el != overlappingCard))) {
							run.splice(run.indexOf(overlappingCard), 1);
							break
						} else if (possibleSets[rank].length > 3 && possibleSets[rank].indexOf(overlappingCard !== -1)) {
							// possibleSets[rank](possibleSets[rank].indexOf(overlappingCard), 1);
							// todo @Jack -> I changed this to the following... could you just have another look and check
							//  if this is what you originally intended?
							possibleSets[rank].splice(possibleSets[rank].indexOf(overlappingCard), 1);
						} else {
							delete distinctRuns[suit][distRunChoice]
						}
					}
				}
			}
		}
	}
	let returnArray = []
	for (let rank in possibleSets) {
		returnArray.push(possibleSets[rank])
	}
	for (let suit in distinctRuns) {
		returnArray.push(...distinctRuns[suit][distRunChoice])
	}
	return returnArray;
}

getGameByPlayerId = function (searchedPlayerID) {
	for (let gameId in games) {
		if (games[gameId].players.hasOwnProperty(searchedPlayerID)) {
			return games[gameId];
		}
	}
}

exports.getGameByPlayerId = getGameByPlayerId;

exports.getHighestScoringPlayers = function (playerArray) {
	let highScorers = [...playerArray];
	for (let player of highScorers) {
		highScorers = highScorers.filter(el => el.score >= player.score)
	}
	return highScorers
}

exports.niceUsername = function (playerId) {
	const game = getGameByPlayerId(playerId);
	const guests = {};
	for (let playerKey in game.players) {
		if (game.players[playerKey].username == 'guest') {
			guests[playerKey] = (game.players[playerKey]);
		}
	}
	const guestIDs = Object.keys(guests);
	if (guestIDs.includes(playerId)) {
		return `Guest ${guestIDs.indexOf(playerId) + 1}`
	} else {
		return username;
	}
}