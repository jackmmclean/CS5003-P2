import {game, setState} from "./clientUtils.js";
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
                return userCards.hand;
            }
        },
        methods: {
            getHand: function() {
                // get cards from api

                // just as long as we don't have the real data
                // let invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
                // let cards = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));

                // todo don't slice => just for showcase
                // this.setHand(transformCards(cards.slice(7, 17)));
            },
            setHand: function(newHand) {
                userCards.hand = newHand;
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
                return userCards.openDeckCards;
            }
        },
        methods: {
            getOpenDeck: function() {
                // get open deck cards from cards

                // just as long as we don't have the real data
                let invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
                let cards = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));

                // todo don't slice => just for showcase
                this.setOpenDeckCards(transformCards(cards.slice(37, 41)));
            },
            setOpenDeckCards: function(newOpenDeck) {
                userCards.openDeckCards = newOpenDeck;
            }
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
                    setHand(json.hand)
                    userCards.openDeckCards = userCards.openDeckCards[0]
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
                userCards.hand = newHand;
            },
            setOpenDeck: function(newOpenDeck) {
                userCards.openDeckCards = newOpenDeck;
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

const userCards = Vue.observable({
    openDeckCards: [],
    hand: []
});

const setHand = (newHand) => {
    userCards.hand = transformCards(newHand.map(el => el.char))
}

export const makeGame = function() {
    makeGameInfoVue();
    makePlayerHandVue();
    makeClosedDeckVue();
    makeOpenDeckVue();
    makeUserActionsVue();
}