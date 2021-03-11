import {gameState} from "./gameState.js";

/**
 * Authenticate a user with the server using the gameState.userKey user data.
 * @returns {int} HttpStatus (200 if successful, 401 if authentication failed)
 * */
export const login = function() {
    return fetch("/api/users/login", {
        method: "POST",
        headers: {"Authorization": "Basic " + gameState.userKey}
    }).then((res) => {return res.status})
}