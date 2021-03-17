import {
	game,
	setGuestUser,
	setState,
	login, isGuest, sharedGameInfo
} from "./clientUtils.js";

const makeLoginVue = function () {
	const loginVue = new Vue({
		el: "#login",
		data: {
			username: "",
			password: "",
			message: "",
		},
		computed: {
			state() {
				return game.state;
			},
		},
		methods: {
			login: async function () {
				this.message = "";

				// update the userKey
				game.userKey = btoa(this.username + ':' + this.password)

				// get login response and process it
				let loginResponse = await login();

				if (loginResponse.hasOwnProperty('role')) {
					console.log('Authentication successful')
					setState("lobby");
					this.hideRegistrationCard();
					sharedGameInfo.generalInfo.Username = this.username;
					sharedGameInfo.userInfo.playedGames = loginResponse.playedGames;
					sharedGameInfo.userInfo.allTimeScore = loginResponse.allTimeScore;
					sharedGameInfo.userInfo.role = loginResponse.role;
				} else {
					console.log('Authentication failed.')
					this.message = "Wrong password or username.";
				}
			},
			showRegistrationCard: function () {
				registrationCard.show = true;
			},
			hideRegistrationCard: function () {
				registrationCard.show = false;
			}
		}
	})
}

const makeRegisterVue = function () {
	const registerVue = new Vue({
		el: "#register",
		data: {
			username: "",
			password: "",
			passwordConfirm: "",
			message: "",
		},
		computed: {
			state() {
				return game.state;
			},
			showRegistrationCard() {
				return registrationCard.show;
			}
		},
		methods: {
			register: function () {

				// Validate that both passwords are the same
				this.message = ""
				this.message += (this.password !== this.passwordConfirm) ? "Passwords don't match." : "";

				// register the new user
				if (this.message === "") {
					fetch('/api/users/register-user', {
						method: 'POST',
						headers: {
							username: this.username,
							password: this.password
						}
					}).then((res) => {
						if (!res.ok) {
							throw new Error(`Got response ${res.status}`);
						}
					}).then(() => {
						this.message = 'Successfully registered. You can now login.'
					}).catch((err) => {
						console.log(err);
						this.message = 'Registration failed.';
					})
				}
			}
		}
	})
}

const makeGuestVue = function () {
	const guestVue = new Vue({
		el: "#guest",
		computed: {
			state() {
				return game.state;
			},
		},
		methods: {
			loginAsGuest: async function () {
				// set the userKey to the guest data
				setGuestUser();

				// get the login response and process it
				let loginResponse = await login();

				if (loginResponse.hasOwnProperty('role')) {
					sharedGameInfo.userInfo.role = loginResponse.role;
					console.log('Authentication successful')
					setState("lobby");
				} else {
					alert("Could not login as guest. Try registering a user.")
				}
			}
		}
	})
}

const makeUserNavVue = function() {
	const userNavVue = new Vue({
		el: "#user-nav",
		data: {
			backToLobbyBtnText: "Back to Lobby"
		},
		computed: {
			state() {
				return game.state;
			},
			logoutBtnText() {
				return isGuest() ? "Back to Login" : "Logout";
			},

		},
		methods: {
			logout: function() {
				setState("login");
			},
			backToLobby: function() {
				setState("lobby");
			}
		}
	})
}

/**
 * Mini vue that controls the color picker.
 * */
const makeColorPickerVue = function() {
	const colorPickerVue = new Vue({
		el: "#color-picker",
		data: { color: '#477148' },
		watch: { color: (c) => setBodyColor(c) }
	})
}

const makeRulesVue = function() {
	const rulesVue = new Vue({
		el: "#rules",
		data: {
			isHidden: true,
			ruleText: "<p>The goal of the game is to have a hand that only contains melds (sets or runs).</p>" +
				"<p>Each player receives 10 cards (or 7, if there are more than two players).<p>" +
				"<p>Taking turns, the players draw a card either from the open or from the closed deck.</p>" +
				"<p>Then, they deposit one card from their hand to the open deck.</p>" +
				"<p>Once a player has only melds on their hand, they can declare Gin.</p>" +
				"<p>If the meld is valid, they win the game. If not, they lose.</p>" +
				"<p>Alternatively, a player can knock to submit their current hand even if they don't have Gin.</p>" +
				"<p>In this case, they win if they have less deadwood than their opponents.</p>"
		},
		computed: { state() {return game.state;} },
		methods: {
			show() { this.isHidden = false; },
			hide() { this.isHidden = true; }
		}
	})
}

/**
 * Set the background color of the body.
 * */
const setBodyColor = (color) => {
	document.querySelector("HTML").style.backgroundColor = color;
	document.body.style.backgroundColor = color;
}

const registrationCard = Vue.observable({
	show: false,
})

export const makeEntry = function () {

	makeLoginVue();
	makeRegisterVue();
	makeGuestVue();
	makeUserNavVue();
	makeColorPickerVue();
	makeRulesVue();
}