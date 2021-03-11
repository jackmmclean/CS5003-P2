// Convenience object to keep track of the state of the game on the client side.
// While a savvy user might be able to change these value manually, they could not cheat as the actual
// processing and validation is still done on the server.
export const gameState = {
    state: 'login',
    userKey: '',
};

/**
 * Set the userKey to the guest user key.
 * */
export const setGuestUser = function () {
    gameState.userKey = btoa('guest' + ':' + '')
};

