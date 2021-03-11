// Vue observable that is accessible and observable by all vue components that
// reference it in a computed method.
export const game = Vue.observable({
    state: 'login',
    userKey: '',
});

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
    game.state = state;
}
