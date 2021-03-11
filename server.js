const express = require("express");
const bodyParser = require("body-parser")
const {
	drawClosedCard, drawOpenCard, startGame, createGame, joinGame, getScore, getGames, depositCard,
	login, registerUser, gameStats, declareGin
} = require("./api");

const app = express();
const {users} = require('./users')
const basicAuth = require('basic-auth');

app.use(bodyParser.json());
app.use(express.static("content"))

// Basic authentication
let authenticate = function(req, res, next) {
	let user = basicAuth(req);
	console.log(user)
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

app.get('/game', authenticate, (req, res) => {
	res.sendFile(__dirname + '/content/game.html')
})


// API routes
app.get('/api/lobby/getGames', (req, res) => {
	let games = getGames();
	res.json(games);
})

app.post('/api/lobby/joinGame/:gameId', (req, res) => {
	let gameId = req.params.gameId;
	let game = joinGame(gameId);
	res.json(game);
})

app.post('/api/game/create/', (req, res) => {
	let names = req.body.names;
	let knockingAllowed = req.body.knockingAllowed;
	let lowHighAceAllowed = req.body.lowHighAceAllowed;
	let numPlayers = req.body.numPlayers;

	let game = createGame(names, knockingAllowed, lowHighAceAllowed, numPlayers);

	res.json(game);
})

app.get('/api/game/start/:playerId', (req, res) => {
	let game = startGame(req.params.playerId);
	res.json(game)
})

app.get('/api/game/draw-open-card/:playerId', (req, res) => {
	let card = drawOpenCard(req.params.playerId);
	res.json(card);
})

app.get('/api/game/draw-closed-card/:playerId', (req, res) => {
	let card = drawClosedCard(req.params.playerId);
	res.json(card);
})

app.post('/api/game/post-card/:playerId', (req, res) => {
	depositCard(req.params.playerId, req.body.cardNo)
	res.send(200);
})

app.post('/api/game/declare-gin/:playerId', (req, res) => {
	let winOrLose = declareGin(req.params.playerId);
	res.json(winOrLose);
})

app.get('/api/game/game-stats/:gameId', (req, res) => {
	let gameStats = gameStats();
	res.json(gameStats);
})

app.post('/api/users/register-user', (req, res) => {
	let username = req.headers.username;
	let password = req.headers.password;
	console.log(users)
	let registration = registerUser(username, password);
	// todo send text too
	console.log(users)
	res.status(registration.status).send(registration.text);
})

app.post('/api/users/login', authenticate, (req, res) => {
	// let username = req.body.username;
	// let password = req.body.password;
	// login(username, password);
	res.sendStatus(200);
})

app.get('/api/users/scores/:username', (req, res) => {
	username = req.params.username;
	getScore(username);
})

const PORT = 3000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))