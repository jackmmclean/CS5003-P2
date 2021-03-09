const makeGameInfoVue = function() {
    const gameInfoVue = new Vue({
        el: "#game-info",
        data: {
            generalInfo: [
                {key: "Time", value: "some time"},
                {key: "Players", value: "a number"}
            ]
        },
        methods: {
            login: function () {
                // todo login via API
                console.log(`Sending data to API: ${this.username}, ${this.password}`)
            }
        }
    })
}

const makePlayerHandVue = function() {
    const playerHandVue = new Vue({
        el: "#player-hand",
        data: {
            msg: 'msg from playerHandVue',
            hand: []
        },
        methods: {
            getHand: function() {
                // get cards from api
                let invalidCharCodes = [127148, 127151, 127152, 127164, 127167, 127168, 127180, 127183, 127184, 127196];
                let cards = Array.from(Array(62).keys()).map(el => el + 127137).filter(el => !invalidCharCodes.includes(el));
                let hand = []
                for (let c of cards) {
                    hand.push({card: '&#'+c+';', color: ((c <= 127150) || (c >= 127185)) ? "black" : "darkred"})
                }
                // todo don't slice => just for showcase
                this.hand = hand.slice(7, 17);
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
        data: {msg: 'msg from closedDeckVue'},
        methods: {}
    })
}

const makeOpenDeckVue = function() {
    const openDeckVue = new Vue({
        el: "#open-deck",
        data: {msg: 'msg from openDeckVue'},
        methods: {}
    })
}

export const makeGame = function() {
    makeGameInfoVue();
    makePlayerHandVue();
    makeClosedDeckVue();
    makeOpenDeckVue();
}