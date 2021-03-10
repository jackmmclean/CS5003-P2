const makeLoginVue = function() {
    const loginVue = new Vue({
        el: "#login",
        data: {
            username: "",
            password: "",
            message: ""
        },
        methods: {
            login: function () {
                this.message = "";
                // todo login via API
                let user_key = btoa(this.username + ':' + this.password)

                // todo fix this -> location.href = 'lobby' doesn't work
                //  as the auth header is not propagated from the first call to the lobby redirect
                // fetch('/api/authenticate-user', {
                //     method: "GET",
                //     headers: {"Authorization": "Basic " + user_key}
                // }).then((res) => {
                //     if (!res.ok) {
                //         throw new Error('Authentication failed')
                //     }
                // }).then((res) => {
                //     console.log('Authentication successful')
                //     location.href='lobby'
                // })
                // .catch((err) => {
                //     console.log(err)
                //     this.message = "Wrong password or username.";
                // })
            }
        }
    })
}

const makeRegisterVue = function() {
    const registerVue = new Vue({
        el: "#register",
        data: {
            username: "",
            password: "",
            passwordConfirm: "",
            message: ""
        },
        methods: {
            register: function () {
                this.message = ""
                this.message += (this.password !== this.passwordConfirm) ? "Passwords don't match." : "";
                this.message += (this.message !== "") ? " ": ""
                this.message += (this.password.length < 4) ? "Password must be at least 4 characters long." : "";
                if (this.message === "") {
                    // todo register via API
                    console.log(`Sending data to API: ${this.username}, ${this.password}, ${this.passwordConfirm}`)
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
                        this.message = 'No success.'
                    })
                } else {
                    console.log(`Registration failed. ${this.message}`)
                }
            }
        }
    })
}

const makeGuestVue = function() {
    const guestVue = new Vue({
        el: "#guest",
        methods: {
            playAsGuest: function () {
                // this happens before rerouting to lobby
                // todo send guest login to server
                console.log(`Sending data to API: Play as guest`)
            }
        }
    })
}

export const makeEntry = function() {
    makeLoginVue();
    makeRegisterVue();
    makeGuestVue();
}