import {game, setState} from "./clientUtils.js";

const makeJoinGameByIdVue = function() {
    const joinGameByIdVue = new Vue({
        el: "#join-game-by-id",
        data: {
            gameId: "",
            message : "",
        },
        computed: {
            state() {
                return game.state;
            },
        },
        methods: {
            join: function () {
                // todo check if game is available -> try - catch
                //  if yes, enter and display gameId and players
                //  else, display msg
                if (true) {
                    console.log(`Sending data to API: ${this.gameId}`);
                    setState('play')
                } else {
                    // show a message to the user why they could not join the game
                    this.message = "Could not join game.";
                }
            }
        }
    })
}

const makeNewGameVue = function() {
    const newGameVue = new Vue({
        el: "#new-game",
        data: {
            message : "",
        },
        computed: {
            state() {
                return game.state;
            },
        },
        methods: {
            createNewGame: function () {
                // todo create a new game -> try - catch
                //  if successful, enter this game and display gameID
                //  else, display msg

                fetch('/api/game/create', {
                    method: "POST",
                    headers: {"Authorization": "Basic " + game.userKey},
                    playerId: game.playerId,
                    // todo user choice
                    knockingAllowed: true,
                    lowHighAceAllowed: true,
                }).then((res) => {
                    if (!res.ok) {
                        this.message = "Couldn't create game."
                    } else {
                        return res.json()
                    }
                }).then((json) => {
                    game.gameId = json.gameId
                    console.log(json.text)
                    setState('play');
                })
            }
        }
    })
}

const makeOpenGamesVue = function() {
    const openGamesVue = new Vue({
        el: "#open-games",
        data: {
            openGames: [],
        },
        computed: {
            state() {
                if (game.state === 'lobby') {
                    // get the games if we're in the lobby
                    this.getGames();
                }
                return game.state;
            },
        },
        methods: {
            getGames: function() {
                console.log('Getting games from /api/lobby/get-games')
                fetch('/api/lobby/get-games', {
                    method: "GET",
                    headers: {"Authorization": "Basic " + game.userKey}
                }).then((res) => {
                    if (!res.ok) {
                        throw new Error(`Response has status ${res.status}`)
                    }
                    return res.json();
                }).then((json) => {
                    this.openGames = json.games;
                    console.log(this.openGames)
                }).catch(err => console.log('There was an error.', err))

                this.openGames = ['uuid1', 'uuid2', 'uuid3', 'uuid4']
            },
            join: function (gameId) {
                // todo create a new game -> try - catch
                //  if successful, enter this game
                //  else, display msg
                if (true) {
                    fetch(`/api/lobby/join-game/${gameId}`, {
                        method: "POST",
                        headers: {"Authorization": "Basic " + game.userKey}
                    }).then((res) => {
                        if (!res.ok) {
                            throw new Error(`Response has status ${res.status}`)
                        }
                        return res.json();
                    }).then((json) => {
                        console.log('JSON', json);
                        setState('play')
                    }).catch(err => console.log('Could not join game.', err))
                }
            },
        },
    })
}

export const makeLobby = function() {
    makeJoinGameByIdVue();
    makeNewGameVue();
    makeOpenGamesVue();
}