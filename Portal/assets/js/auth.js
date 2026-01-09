/**
 * auth.js
 * Bloquea el acceso a páginas privadas si no hay sesión
 */

import { getUser } from "./user.js";

export function requireAuth() {
    const user = getUser();

    if (!user || user.logged !== true) {
        window.location.href = "login.html";
    }
}
