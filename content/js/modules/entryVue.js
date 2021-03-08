console.log('entryVue.js runnning')

const makeLoginVue = function() {
    const loginVue = new Vue({
        el: "#login",
        data: {
            username: "",
            password: "",
        },
        methods: {
            login: function () {
                // todo login via API
                console.log(`Sending data to API: ${this.username}, ${this.password}`)
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
                // todo login via API
                this.message = ""
                this.message += (this.password !== this.passwordConfirm) ? "Passwords don't match." : " ";
                this.message += (this.message !== "") ? " ": ""
                this.message += (this.password.length < 4) ? "Password must be at least 4 characters long." : " ";
                if (this.message === "") {
                    // todo validate username
                    console.log(`Sending data to API: ${this.username}, ${this.password}, ${this.passwordConfirm}`)
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
                // todo login via API
                console.log(`Sending data to API: Guest`)
            }
        }
    })
}

export const makeEntry = function() {
    makeLoginVue();
    makeRegisterVue();
    makeGuestVue();
}