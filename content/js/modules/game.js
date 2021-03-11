// Vue observable that is accessible and observable by all vue components that
// reference it in a computed method.
export const game = Vue.observable({
    state: 'login',
    userKey: '',
});

// all allowed states
const ALLOWED_STATES = ['login', 'lobby', 'play', 'end']

/**
 * Set the userKey to the guest user key.
 * */
export const setGuestUser = function () {
    game.userKey = btoa('guest' + ':' + '')
};

/**
 * Set the state to a new value.
 * @param state {string} the new state.
 * */
export const setState = function(state) {
    if (ALLOWED_STATES.includes(state)) {
        game.state = state;
    } else {
        console.log(`Tried to set invalid state ${state}. Must be one of ${ALLOWED_STATES}.`)
    }

}
