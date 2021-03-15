import {
	game
} from "./clientUtils.js";

const makeEndVue = function () {
	const endVue = new Vue({
		el: "#end",
		data: {
winner: 
		},
		computed: {
			state() {
				return game.state;
			}
		},
		methods: {


		}
	})
}

export const makeEnd = function () {
	makeEndVue();
}