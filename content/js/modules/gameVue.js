import {game, getCards, setState} from "./clientUtils.js";
const makeGameInfoVue = function() {
    const gameInfoVue = new Vue({
        el: "#game-info",
        data: {
            generalInfo: {
                Username: "",
                Turn: "who's turn",
                Action: "possible action",
                Time: "some time",
                Players: "a number"
            }
        },
        computed: {
            state() {
                if (game.state === 'play') {
                    // get the game stats if we're playing
                    this.getGameStats();
                    startInterval();
                }
                return game.state;
            },
        },
        methods: {
            getGameStats: function () {
                fetch(`/api/game/game-stats/${game.playerId}`, {
                    method: "GET",
                    headers: {"Authorization": "Basic " + game.userKey},
                }).then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP Error ${res.status}`)
                    } else {
                        return res.json();
                    }
                }).then((json) => {
                    this.generalInfo.Username = json.username;
                    this.generalInfo.Players = json.numPlayers;
                }).catch(err => console.log('Could not get stats.', err))
            }
        },
    })
}

const makePlayerHandVue = function() {
    const playerHandVue = new Vue({
        el: "#player-hand",
        data: {},
        computed: {
            state() {
                if (game.state === 'play') {
                    // get the game stats if we're playing
                    this.getHand();
                }
                return game.state;
            },
            hand() {
                return sharedGameInfo.hand;
            }
        },
        methods: {
            getHand: function() {
                // get cards from api
            },
            setHand: function(newHand) {
                sharedGameInfo.hand = newHand;
            },
        },
    })
}

const makeClosedDeckVue = function() {
    const closedDeckVue = new Vue({
        el: "#closed-deck",
        data: {
            backOfCard: {card: "&#127136", color: "#0d47a1"}
        },
        computed: {
            state() {
                return game.state;
            },
            showBackOfCard() {
                return sharedGameInfo.showBackOfCard;
            }
        },
        methods: {}
    })
}

const makeOpenDeckVue = function() {
    const openDeckVue = new Vue({
        el: "#open-deck",
        data: {},
        computed: {
            state() {
                if (game.state === 'play') {
                    // get the game stats if we're playing
                    this.getOpenDeck();
                }
                return game.state;
            },
            openDeckCards() {
                return sharedGameInfo.openDeckCards;
            }
        },
        methods: {
            getOpenDeck: function() {
                // get open deck cards from cards
            },
        },
    })
}

const makeUserActionsVue = function() {
    const userActionsVue = new Vue({
        el: "#user-actions",
        data: {},
        computed: {
            state() {
                return game.state;
            },
            showStartGameBtn() {
                return sharedGameInfo.showStartGameBtn;
            }
        },
        methods: {
            startGame: function() {
                // start the game for all players
                fetch(`/api/game/start/${game.playerId}`, {
                    method: "GET",
                    headers: {"Authorization": "Basic " + game.userKey}
                }).then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`)
                    } else {
                        return res.json();
                    }
                }).then((json) => {
                    setHand(json.hand);
                    setOpenDeck(json.openDeck);
                    showBackOfCard();
                }).catch(err => console.log(err))
            },
            declareGin: function() {
                // todo send declare gin to API and process response
                console.log('Declare gin');
            },
            knock: function() {
                // todo send knock to API and process response
                console.log('Knock');
            },
            setHand: function(newHand) {
                sharedGameInfo.hand = newHand;
            },
            setOpenDeck: function(newOpenDeck) {
                sharedGameInfo.openDeckCards = newOpenDeck;
            }
        }
    })
}
const transformCards = function(numericCards) {
    let cards = []
    for (let c of numericCards) {
        cards.push({card: '&#'+c+';', color: ((c <= 127150) || (c >= 127185)) ? "black" : "darkred"})
    }
    return cards;
}

const sharedGameInfo = Vue.observable({
    openDeckCards: [],
    hand: [],
    showBackOfCard: false,
    showStartGameBtn: false,
});

const setHand = (newHand) => {
    sharedGameInfo.hand = transformCards(newHand.map(el => el.char));
}

const setOpenDeck = (newOpenDeck) => {
    sharedGameInfo.openDeckCards = transformCards(newOpenDeck.map(el => el.char));
}

const showBackOfCard = () => {sharedGameInfo.showBackOfCard = true;}

const setStartGameBtn = (show) => {sharedGameInfo.showStartGameBtn = show}

let pollInterval = null;

const startInterval = () => {pollInterval = setInterval(() => {
    // todo fill in the other data that needs to get polled and how to process it
    fetch(`/api/game/poll/${game.playerId}`, {
        method: "GET",
        headers: {"Authorization": "Basic " + game.userKey}
    }).then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
        } else {
            return res.json();
        }
    }).then(async (json) => {
        // todo if game has started, pull game
        setStartGameBtn(json.isOwner)
        if (json.gameHasStarted) {
            console.log('Game started')
            const cards = await getCards()
            setHand(cards.hand);
            setOpenDeck(cards.openDeck);
            showBackOfCard();
        } else {
            console.log('Game not started yet')
        }

    }).catch(err => console.log(err))

}, 1000);}

const clearInterval = () => {clearInterval(pollInterval)}

// todo Poll server every 100 ms
//  check if game has started
//  if yes (get data) else wait another 100 ms

export const makeGame = function() {
    makeGameInfoVue();
    makePlayerHandVue();
    makeClosedDeckVue();
    makeOpenDeckVue();
    makeUserActionsVue();
}