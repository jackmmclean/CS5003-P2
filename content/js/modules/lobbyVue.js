const makeJoinGameByIdVue = function() {
    const joinGameByIdVue = new Vue({
        el: "#join-game-by-id",
        data: {
            gameId: "",
            message : ""
        },
        methods: {
            join: function () {
                // todo check if game is available
                //  if yes, enter lobby and display gameId and players
                //  else, display msg
                console.log(`Sending data to API: ${this.gameId}`)
                this.message = "Sent to API.";
            }
        }
    })
}

const makeNewGameVue = function() {
    const newGameVue = new Vue({
        el: "#new-game",
        data: {
            message : ""
        },
        methods: {
            createNewGame: function () {
                // todo create a new game
                //  if successful, enter lobby for this game and display gameID
                //  else, display msg
                console.log(`Sending data to API: Create game.`)
                this.message = "Sent to API."
            }
        }
    })
}

const makeOpenGamesVue = function() {
    const openGamesVue = new Vue({
        el: "#open-games",
        data: {
            openGames: []
        },
        methods: {
            getGames: function() {
                // todo get games from API
                console.log('getting games from API')
                this.openGames = ['uuid1', 'uuid2', 'uuid3', 'uuid4']
            },
            join: function (gameId) {
                // todo reroute to lobby
                console.log(`Sending data to API: Join game ${gameId}`)
            },
        },
        created: function() {
            this.getGames();
        }
    })
}

export const makeLobby = function() {
    makeJoinGameByIdVue();
    makeNewGameVue();
    makeOpenGamesVue();
}