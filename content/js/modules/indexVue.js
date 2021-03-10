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
                console.log(`Sending data to API: ${this.username}, ${this.password}`)
                // todo if login successful, redirect to lobby, else show error message
                if (true) {
                    location.href='lobby.html'
                } else {
                    this.message = "Wrong password or username.";
                }
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
                    // redirect to lobby
                    location.href='lobby.html'
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