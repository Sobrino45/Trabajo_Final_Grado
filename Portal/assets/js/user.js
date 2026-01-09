/**
 * user.js
 * Gestiona el usuario en localStorage
 * No contiene lógica de DOM ni de juegos
 */

const USER_KEY = "casino_user";

export function getUser() {
    return JSON.parse(localStorage.getItem(USER_KEY));
}

export function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    const user = getUser();
    if (!user) return;
    user.logged = false;
    saveUser(user);
}

export function userExists() {
    return getUser() !== null;
}
