import {
	game,
	setGuestUser,
	setState,
	login, isGuest
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

				if (loginResponse === 200) {
					console.log('Authentication successful')
					setState("lobby");
					this.hideRegistrationCard();
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

				if (loginResponse === 200) {
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

/**
 * Set the background color of the body.
 * */
const setBodyColor = (color) => {
	document.body.style.backgroundColor = color;
}

const registrationCard = Vue.observable({
	show: false,
})

export const makeEntry = function () {


	 // modal attribution https://stackoverflow.com/a/53594839/12168211
	let modal = document.getElementById("my-modal");

	document.getElementById("modal-button").onclick = () => {
		modal.classList.remove("hidden")
	};

	document.getElementById("my-modal").onclick = () => {
		modal.classList.add("hidden");
	};

	makeLoginVue();
	makeRegisterVue();
	makeGuestVue();
	makeUserNavVue();
	makeColorPickerVue();

	// todo take this out: this is only for development to navigate between states
	const navVue = new Vue({
		el: "#nav-state",
		methods: {
			setLogin: () => setState("login"),
			setLobby: () => setState("lobby"),
			setPlay: () => setState("play"),
			setHistory: () => setState("history"),
			setEnd: () => setState("end")
		}
	})
}