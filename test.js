
//define a players object
makePlayer = function (username) {
	function Player(username) {
		this.username = username;
		this.id =  1;
		this.melds = null;
		this.score = 0;
		this.roundScore = 0;
	}
	return new Player(username)
}

 makeGame = function (username, knockingAllowed, lowHighAceAllowed, roundMode, gameId = '') {
	function Game() {
		this.id = (gameId !== '') ? gameId :  1;
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
			timeLeft: 60
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
				users[player.username].playedGames++;
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

			//if the game has started, put players cards back and remove them from the turn order
			if (this.timeStarted != null) {
				//put players cards back
				this.cards.deck = shuffle([...this.cards.deck, ...player.hand()]);

				//if it was the player leaving's turn and they were depositing then ensure that the
				//next player starts their turn with a draw
				if (this.turnOrder[this.turnPlayerIndex] === player && this.currentAction === 'deposit') {
					this.toggleAction();
				}

				// remove from turn order
				this.turnOrder.splice(this.turnOrder.indexOf(player), 1)

				// update turnPlayerIndex if the removed element was the last one in turnPlayer.order
				this.turnPlayerIndex = (this.turnPlayerIndex < this.turnOrder.length) ? this.turnPlayerIndex : 0
			}

			//check if the player being removed is / was the owner
			let isOwner = this.owner === player ? true : false

			// remove from players
			delete this.players[playerId]

			//if they were the owner then assign a new owner as the next person in players obj
			if (isOwner) {
				this.owner = Object.entries(this.players)[0][1]
			}

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
	   ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
	// value of ace is 1 by default but we change this when checking (if high or low aces is toggled)

	   suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
	// define invalid cards, for example the 'knights' cards
	   invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
	// define charCodes for regular deck of cards as unicode chars from 127137 to 127198 minus invalidCharCodes
	   charCodes = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));

	//  ructor function for cards
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
	   cardsPerPlayer = (numOfPlayers === 2) ? 10 : 7;

	//define cards object, deck is shuffled deck define before
	let cards = {
		deck: shuffle(deck),
		openDeck: deck.splice(0, 1)
	}

	//assign object attributes that hold each players cards
	for (let [k, ] of Object.entries(players)) {
		cards[k] = cards.deck.splice(0, cardsPerPlayer);
	}

	//  ructor function for instances of cards, used for
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
			cards.deck.push(...shuffle(cards.openDeck.splice(0, cards.openDeck.length - 1)))
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
   processGinDeclared = function (declaringPlayer, game) {

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

 processGinDeclared = (declaringPlayer, game) => {
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

 processKnock = function (game) {
	return processKnock(game)
}

/**
 * Calculate the scores for each player after a player knocked.
 * @param game {Object} The current game
 * @param declaringPlayer {Object} The one who knocks (Walter White)  ... sorry, I could not resist ;-)
 * */
 getRoundKnockScores = function (game, declaringPlayer) {

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
 getRoundGinScores = function (game, declaringPlayer) {

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

 createMessage = function (playerId, text) {
	   game = getGameByPlayerId(playerId);

	function Message(playerId, text) {
		//we will only display time, but timeStamp is stored as full date for potential future use 
		//eg including user messages with long term scores
		this.id =  1;
		this.niceUsername = niceUsername(playerId);
		this.timeStamp = new Date().toISOString().substr(11, 8);
		this.playerId = playerId;
		this.text = text;
	}
	   message = new Message(playerId, text);
	game.messages.push(message);
	return message
}

makeTurnTimer = function (playerId) {

	   SECONDS_PER_TURN = 60;

	   game = getGameByPlayerId(playerId);

	let timer = {
		timeLeft: SECONDS_PER_TURN,
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
			timer.timeLeft = SECONDS_PER_TURN;
			timer.timerFunction = setInterval(() => {
				if (timer.timeLeft === 0) {
					clearInterval(timer.timerFunction);
					game.removePlayer(newPlayerId);
					if (Object.keys(game.players).length < 2) {
						game.endGame();
					}
				} else {
					timer.timeLeft--;
				}
			}, 1000)
		}
	}

	return timer

}
/**
 * Shuffle elements in an array. Implements Fisher-Yates Shuffle.
 * Attribution: https://bost.ocks.org/mike/shuffle/
 * @param array {Array} The array to be shuffled
 * @returns {Array} The shuffled array
 * */
 shuffle = function (array) {

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
	   values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
	   ranks = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
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
 isSet = function (cardArray) {
	if (cardArray.length < 3) return false;
	for (let i = 0; i < cardArray.length - 1; i++) {
		if (cardArray[i].rank !== cardArray[i + 1].rank) return false;
	}
	return true;
}

 isRun = (cardArray, highOrLowAces) => isRun(cardArray, highOrLowAces);

/**
 * Evaluate whether an array of cards is a run.
 * @param cardArray {Array} an array of cards to check.
 * @param highOrLowAces {Boolean} If Ace low or high is allowed
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

	//if we get here then it wasn't a run for either ace value
	return false;
}

/**
 * Get the score of a card.
 * @param card {Object} the card whose score to get.
 * @return {Number} the score of the card
 * */
   cardScore = function (card) {
	if (!isNaN(card.rank)) {
		return parseInt(card.rank);
	} else if (card.rank === 'A') {
		return 1;
	} else return 10;
}

 cardScore = (card) => {
	return cardScore(card)
}

   unmatchedCards = function (meldsArray) {
	let unmatchedCards = [];
	for (let entry of meldsArray) {
		if (!Array.isArray(entry)) {
			unmatchedCards.push(entry)
		}
	}
	return unmatchedCards;
}

 unmatchedCards = function (meldsArray) {
	return unmatchedCards(meldsArray)
}


/**
 * Organises cards into arrays based on their rank and suit - each card appearing in both 
 * a rank array and a suit array.
 * @param cards {Array<Object>} is the array of cards to be categorised.
 * @return {Object} an object with properties that correspond to each suit and rank associated
 * with a card in the input array.
 * */
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

/**
 * Returns all possible runs for a given array of cards.
 * @param cards {Array} is the array of cards to look for runs in.
 * @param highOrLowAce {Boolean} is whether or not we allow high or low aces.
 * @return {Array<Array<Object>>} an array whose elements are arrays of cards that correspond to runs.
 * */
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
			if (isRun(currentCards.slice(j, j + i), highOrLowAce)) {
				possibleRuns.push(currentCards.slice(j, j + i))
			}
		}
	}

	return possibleRuns

}

/**
 * Return all possible melds of cards.
 * @param cards {array}: cards to be checked
 * @returns {Object} object containing two k-v pairs
 * 		- sets: Object with the identifying card value as key and the cards   ituting the meld in an array as value
 * 		- runs: Object with the identifying suit as key and each run in an array of arrays as the value
 * 		- e.g. {
 * 				sets: {Q: [card, card, card]},
 * 				runs: {Spades: [[card, card, card], [card, card, card]]}
 * 				}
 * */
 getAllPossibleMelds = function (cards) {
	//get an object that categorises cards into ranks and suits
	let categories = categoriseCards(cards);
	//delete all categories not big enough to be a possible meld
	for (let category in categories) {
		if (categories[category].length < 3) {
			delete categories[category];
		}
	}

	let allPossibleMelds = {};
	allPossibleMelds.sets = {};
	allPossibleMelds.runs = {};

	   ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

	//for each category, if the category is a rank and there are >2
	//then it is a possible meld
	for (let category in categories) {
		//take sets melds
		if (ranks.includes(category)) {
			allPossibleMelds.sets[category] = (categories[category])
		}
		//take run melds
		else {
			if (getPossibleRuns(categories[category]).length !== 0) {
				allPossibleMelds.runs[category] = (getPossibleRuns(categories[category]));
			}
		}
	}
	return allPossibleMelds
}

/**
 * For a single suit, check if two runs are distinct, i.e. do not share cards
 * @param runA {Array} First run
 * @param runB {Array} Second Run
 * @returns {Boolean} true if the runs are distinct
 * */
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
 getDistinctRuns = function (possibleRuns) {
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

/**
 * Sort by number of cards in array type [[[card,card],[card,card,card.]..],[card,..]..].
 * @param cardsArrayOfArraysOfArrays {Array<Array<Array<Object>>>}
 * @returns {Array<Array<Array<Object>>>}
 * */
 sortByCards = function (cardsArrayOfArraysOfArrays) {

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

/**
 * Get overlapping cards between two arrays
 * @param {Array} distinctRunsArray
 * @param {Array} setArray
 * @returns {Array} An array containing the cards that overlap
 * */
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
 clearDuplicateCards = function (distinctRuns, possibleSets) {

	//we choose the first element in each suit property of the distinct
	//runs object because it is the largest
	let distRunChoice = 0;

	// for every run we check it against the sets for overlapping cards
	for (let suit in distinctRuns) {
		for (let rank in possibleSets) {
			// if it has overlapping cards we remove them:
			let overlappingCardsArray = overlappingCards(distinctRuns[suit][distRunChoice], possibleSets[rank]);
			if (overlappingCardsArray.length > 0) {
				//loop through each overlapping card - ie each card that appears in a run and a set
				for (let overlappingCard of overlappingCardsArray) {
					//for each of those cards, loop through each of the runs and determine whether we should remove the 
					//duplicate/overlapping card from the suit or the run
					console.log('xyz', distinctRuns[suit][distRunChoice])
					for (let run of distinctRuns[suit][distRunChoice]) {
						//if the run contains the overlapping card and will still be a run without it then remove 
						//it from the run
						if (run.includes(overlappingCard) && isRun(run.filter(el => el !== overlappingCard))) {
							run.splice(run.indexOf(overlappingCard), 1);
							break
						}
						//otherwise, if the set includes the overlapping card and will still be a set without it
						//(if it has 4 cards since in sets the order does not matter) then remove from set
						else if (possibleSets[rank].includes(overlappingCard) && possibleSets[rank].length > 3) {
							possibleSets[rank].splice(possibleSets[rank].indexOf(overlappingCard), 1);
						}
						//if removing the overlapping card from the run stops it being a run AND removing the card
						//from the set stops it being a set then we leave the overlapping card in the set and
						//delete the corresponding run
						else {
							console.log
							delete distinctRuns[suit][distRunChoice]
						}
					}
				}
			}
		}
	}
	//format the results into the format we need - [[run array], [set array], ...]
	let returnArray = []
	for (let rank in possibleSets) {
		returnArray.push(possibleSets[rank])
	}
	for (let suit in distinctRuns) {
		returnArray.push(...distinctRuns[suit][distRunChoice])
	}
	return returnArray;
}

/**
 * Get the game that a player is part of based on the playerId
 * @param searchedPlayerID {string}
 * @returns {Object} Game
 * */
getGameByPlayerId = function (searchedPlayerID) {
	for (let gameId in games) {
		if (games[gameId].players.hasOwnProperty(searchedPlayerID)) {
			return games[gameId];
		}
	}
}

 getGameByPlayerId = getGameByPlayerId;

/**
 * Get the player(s) with the highest scores.
 * @param playerArray {Array} the array of players to check
 * @returns {Array<Object>} Array of player(s) with highest scores.
 * */
 getHighestScoringPlayers = function (playerArray) {
	let highScorers = [...playerArray];
	for (let player of highScorers) {
		highScorers = highScorers.filter(el => el.score >= player.score)
	}
	return highScorers
}

 getHighestScoringRoundPlayers = function (playerArray) {
	let highScorers = [...playerArray];
	for (let player of highScorers) {
		highScorers = highScorers.filter(el => el.roundScore >= player.roundScore)
	}
	return highScorers
}

/**
 * Give guest players a nicer name, i.e. name them Guest 1, Guest 2, ...
 * @param playerId {string} The guest player whose name needs to be nicer
 * @returns {string} a nicer username
 * */
niceUsername = function (playerId) {
	   game = getGameByPlayerId(playerId);
	   guests = {};
	for (let playerKey in game.players) {
		if (game.players[playerKey].username === 'guest') {
			guests[playerKey] = (game.players[playerKey]);
		}
	}
	   guestIDs = Object.keys(guests);
	if (guestIDs.includes(playerId)) {
		return `Guest ${guestIDs.indexOf(playerId) + 1}`
	} else {
		return game.players[playerId].username;
	}
}

 niceUsername = function (playerId) {
	return niceUsername(playerId);
}

 transformCards = function (cardsArr) {
	let numericCards = cardsArr.map(el => el.char)
	let cards = []
	for (let c of numericCards) {
		cards.push({
			card: '&#' + c + ';',
			color: ((c <= 127150) || (c >= 127185)) ? "black" : "darkred",
			cardNo: c
		})
	}
	return cards;
}

 calculatePlayerScores = function (game) {

	let players = game.players;

	//reset roundscores
	for (let id in players) {
		players[id].roundScore = 0;
	}
	// assuming that player.melds is an array as above but that all unmatched
	// cards are loose in the array eg for cards 7-9 unmatched
	// player.melds = [[card1,card2,card3],[card4,card5,card,card6], card7, card8, card9]

	//add up the score of all players and store in opponentScores
	let sumOfAllScores = 0;
	let playerCardScores = {};
	for (let [, player] of Object.entries(players)) {
		playerCardScores[player.id] = unmatchedCards(player.melds).reduce((a, b) => cardScore(a) + cardScore(b), 0);
		sumOfAllScores += playerCardScores[player.id];
	}

	//define each players score as the sum of values of all opponents deadwood cards
	for (let [, player] of Object.entries(players)) {
		player.roundScore += sumOfAllScores - playerCardScores[player.id];
		player.score += player.roundScore;
	}

}