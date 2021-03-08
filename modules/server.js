// import {createGame, getGames, joinGame, startGame} from "./api.js";

const express = require("express");
const bodyParser = require("body-parser")
const getGames = require("./api");
const {drawClosedCard} = require("./api");
const {drawOpenCard} = require("./api");
const {startGame} = require("./api");
const {createGame} = require("./api");
const {joinGame} = require("./api");

const app = express();
app.use(bodyParser.json());

app.get('/lobby/getGames', (req, res) => {
    let games = getGames();
    res.json(games);
})

app.post('/lobby/joinGame/:gameId', (req, res) => {
    let gameId = req.params.gameId;
    let game = joinGame(gameId);
    res.json(game);
})

app.post('/game/create/', (req, res) => {
    let names = req.body.names;
    let knockingAllowed = req.body.knockingAllowed;
    let lowHighAceAllowed = req.body.lowHighAceAllowed;
    let numPlayers = req.body.numPlayers;

    let game = createGame(names, knockingAllowed, lowHighAceAllowed, numPlayers);

    res.json(game);
})

app.get('/game/start/:playerId', (req, res) => {
    let game = startGame(req.params.playerId);
    res.json(game)
})

app.get('/game/draw-open-card/:playerId', (req, res) => {
    let card = drawOpenCard(req.params.playerId);
    res.json(card);
})

app.get('/game/draw-closed-card/:playerId', (req, res) => {
    let card = drawClosedCard(req.params.playerId);
    res.json(card);
})

const PORT = 3000;

app.use(express.static("content"))
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))