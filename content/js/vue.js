console.log('vue.js runnning')

let makeGameBoard = function() {
    gameBoardVue = new Vue({
        el: "#gameboard",
        data: {
            message: 'hello from vue'
        }
    })
}

window.onload = makeGameBoard;