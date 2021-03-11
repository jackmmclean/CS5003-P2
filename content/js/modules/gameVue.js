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
                return game.state;
            },
        },
        methods: {
            login: function () {
                // todo login via API
                console.log(`Sending data to API: ${this.username}, ${this.password}`)
            },
            getUserData: function() {
                // todo get userName from API
                //  Question: how do we make sure to get the right user? or game for that matter?
                this.generalInfo.Username = "some name"
            }
        },
        created: function() {
            this.getUserData();
        }
    })
}

const makePlayerHandVue = function() {
    const playerHandVue = new Vue({
        el: "#player-hand",
        data: {
            hand: [],
        },
        computed: {
            state() {
                return game.state;
            },
        },
        methods: {
            getHand: function() {
                // get cards from api

                // just as long as we don't have the real data
                let invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
                let cards = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));

                // todo don't slice => just for showcase
                this.hand = transformCards(cards.slice(7, 17));
            }
        },
        created: function() {
            this.getHand();
        }
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
        data: {
            openDeckCards: []
        },
        computed: {
            state() {
                return game.state;
            },
        },
        methods: {
            getOpenDeckCards: function() {
                // get open deck cards from cards

                // just as long as we don't have the real data
                let invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
                let cards = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));

                // todo don't slice => just for showcase
                this.openDeckCards = transformCards(cards.slice(37, 41));
            }
        },
        created: function() {
            this.getOpenDeckCards();
        }
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
            declareGin: function() {
                // todo send declare gin to API and process response
                console.log('Declare gin');
            },
            knock: function() {
                // todo send knock to API and process response
                console.log('Knock');
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

export const makeGame = function() {
    makeGameInfoVue();
    makePlayerHandVue();
    makeClosedDeckVue();
    makeOpenDeckVue();
    makeUserActionsVue();
}