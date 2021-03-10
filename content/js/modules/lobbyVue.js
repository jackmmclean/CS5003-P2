const makeJoinGameByIdVue = function() {
    const joinGameByIdVue = new Vue({
        el: "#join-game-by-id",
        data: {
            gameId: "",
            message : ""
        },
        methods: {
            join: function () {
                // todo check if game is available -> try - catch
                //  if yes, enter and display gameId and players
                //  else, display msg
                if (true) {
                    console.log(`Sending data to API: ${this.gameId}`);
                    location.href = "game";
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
            message : ""
        },
        methods: {
            createNewGame: function () {
                // todo create a new game -> try - catch
                //  if successful, enter this game and display gameID
                //  else, display msg
                if (true) {
                    console.log(`Sending data to API: Create game.`);
                    location.href = "game";
                } else {
                    // Show a message to the user why they couldn't create a game
                    this.message = "Couldn't create game."
                }
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
                // todo create a new game -> try - catch
                //  if successful, enter this game
                //  else, display msg
                if (true) {
                    console.log(`Sending data to API: ${this.gameId}`);
                    location.href = "game";
                } else {
                    // show a message to the user why they could not join the game
                    this.message = "Could not join game.";
                }
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