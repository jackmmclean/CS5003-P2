const express = require("express");
const bodyParser = require("body-parser")
const {
	drawClosedCard,
	drawOpenCard,
	startGame,
	createGame,
	joinGame,
	getScore,
	getGames,
	depositCard,
	registerUser,
	gameStats,
	declareGin,
	pollGame,
	getCards,
	sendMessage,
	getMessages
} = require("./api");

const app = express();
const {
	users
} = require('./data/data')
const basicAuth = require('basic-auth');
const {validateAction} = require("./api");
const {knock} = require("./api");

app.use(bodyParser.json());
app.use(express.static("content"))

// Basic authentication
let authenticate = function (req, res, next) {
	let user = basicAuth(req);
	if (!user || !users.hasOwnProperty(user.name) || users[user.name].password !== user.pass) {
		//make the browser ask for credentials if none/wrong are provided
		// res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		return res.sendStatus(401);
	}
	req.username = user.name;
	next();
};

// HTML routes
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/content/index.html')
})

// API routes ========

// Get a list of open games
app.get('/api/lobby/get-games', authenticate, (req, res) => {
	res.status(200).json({
		games: getGames()
	});
})

// Let the user join an open game by its gameId
app.post('/api/game/join', authenticate, (req, res) => {
	let gameId = req.body.gameId;
	let game = joinGame(req.username, gameId);
	res.status(game.status).json(game);
})

// Let the user create a new game
app.post('/api/game/create/', authenticate, (req, res) => {
	let knockingAllowed = req.body.knockingAllowed;
	let lowHighAceAllowed = req.body.lowHighAceAllowed;
	let gameId = req.body.gameId;

	let game = createGame(req.username, knockingAllowed, lowHighAceAllowed, gameId);

	res.status(game.status).json(game);

})

// Let the user start a game (that they created themselves)
app.get('/api/game/start/:playerId', authenticate, (req, res) => {
	let game = startGame(req.params.playerId);
	if (game.status === 400) {
		// error because player !=== owner tried to start game
		res.status(400).json(game)
	} else {
		res.status(200).json(game)
	}
})

// Let the user draw the top card from the open deck
app.get('/api/game/draw-open-card/:playerId', authenticate, (req, res) => {
	const validated = validateAction(req.params.playerId, 'draw')
	if (validated.status !== 200) {
		res.status(validated.status).json(validated)
	} else {
		const card = drawOpenCard(req.params.playerId);
		res.status(200).json(card);
	}
})

// Let the user draw the top card from the closed deck
app.get('/api/game/draw-closed-card/:playerId', authenticate, (req, res) => {
	const validated = validateAction(req.params.playerId, 'draw')
	if (validated.status !== 200) {
		res.status(validated.status).json(validated)
	} else {
		const card = drawClosedCard(req.params.playerId);
		res.status(200).json(card);
	}
})

// Let the user deposit a card to the open deck
app.post('/api/game/deposit-card/:playerId', authenticate, (req, res) => {
	const validated = validateAction(req.params.playerId, 'deposit')
	if (validated.status !== 200) {
		res.status(validated.status).json(validated)
	} else {
		const hand = depositCard(req.params.playerId, req.body.cardNo)
		res.status(hand.status).json(hand);
	}
})

// Let the user declare Gin
app.post('/api/game/declare-gin/:playerId', authenticate, (req, res) => {
	const validated = validateAction(req.params.playerId, 'declare')
	if (validated.status !== 200) {
		res.status(validated.status).json(validated)
	} else {
		const winOrLose = declareGin(req.params.playerId);
		res.status(winOrLose.status).json(winOrLose);
	}
})

app.post('/api/game/knock/:playerId', authenticate, (req, res) => {
	const validated = validateAction(req.params.playerId, 'knock')
	if (validated.status !== 200) {
		res.status(validated.status).json(validated)
	} else {
		const winOrLose = knock(req.params.playerId);
		res.status(winOrLose.status).json(winOrLose);
	}
})

// Send information about the game back to the user
app.get('/api/game/game-stats/:playerId', authenticate, (req, res) => {
	const playerId = req.params.playerId;
	let stats = gameStats(playerId);
	stats.username = req.username;
	res.status(200).json(stats);
})

// get messages from server
app.get('/api/game/messages/:gameId', (req, res) => {
	const gameId = req.params.gameId;
	res.status(getMessages(gameId).status).json(getMessages(gameId));
})

app.post('/api/game/messages', (req, res) => {
	const playerId = req.body.playerId;
	const text = req.body.text;

	const message = sendMessage(playerId, text);

	res.status(message.status).json(message);

})

// Let player poll every few ms to check data about the game
app.get('/api/game/poll/:playerId', authenticate, (req, res) => {
	const playerId = req.params.playerId;
	const pollData = pollGame(playerId);
	res.status(200).json(pollData)
})

app.get('/api/game/get-cards/:playerId', authenticate, (req, res) => {
	const playerId = req.params.playerId;
	const cards = getCards(playerId);
	res.status(cards.status).json(cards);
})

// Register a new user
app.post('/api/users/register-user', (req, res) => {
	let username = req.headers.username;
	let password = req.headers.password;
	let registration = registerUser(username, password);
	res.status(registration.status).json(registration);
})

// Login to an existing user
app.post('/api/users/login', authenticate, (req, res) => {
	res.sendStatus(200);
})

// Get the all time scores for a user
app.get('/api/users/scores/:username', authenticate, (req, res) => {
	// todo
	const username = req.params.username;
	getScore(username);
})

const PORT = 3000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))