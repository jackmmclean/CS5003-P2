import {gameState, setGuestUser} from "./gameState.js";
import {login} from "./clientUtils.js"

export const makeEntry = function() {
    const loginVue = new Vue({
        el: "#login",
        data: {
            username: "",
            password: "",
            message: "",
            state: "login",
        },
        methods: {
            login: async function () {
                this.message = "";

                // update the userKey
                gameState.userKey = btoa(this.username + ':' + this.password)

                // get login response and process it
                const loginResponse = await login();

                if (loginResponse === 200) {
                    console.log('Authentication successful.')
                    updateGameState("lobby");
                } else {
                    console.log('Authentication failed.')
                    this.message = "Wrong password or username.";
                }
            }
        }
    })

    const registerVue = new Vue({
        el: "#register",
        data: {
            username: "",
            password: "",
            passwordConfirm: "",
            message: "",
            state: "login",
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
                        this.message = 'Registration failed.'
                    })
                }
            }
        }
    })

    const guestVue = new Vue({
        el: "#guest",
        data: {
            state: "login",
        },
        methods: {
            loginAsGuest: async function () {
                // set the userKey to the guest data
                setGuestUser();

                // get the login response and process it
                const loginResponse = await login();

                if (loginResponse === 200) {
                    console.log('Authentication successful')
                    updateGameState("lobby");
                } else {
                    alert("Could not login as guest. Try registering a user.")
                }
            }
        }
    })

    /**
     * Update the state on all vue components as well as gameState.state.
     * @param state {string} The new game state
     * */
    const updateGameState = function(state) {
        for (let comp of [loginVue, registerVue, guestVue]) {
            comp.state = state;
        }
        gameState.state = state;
    }

}