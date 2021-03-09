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
        data: {msg: 'msg from playerHandVue'},
        methods: {}
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