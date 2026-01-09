/**
 * wallet.js
 * Gestiona el saldo del usuario
 * Los juegos NUNCA deben modificar el saldo directamente
 */

import { getUser, saveUser } from "./user.js";

export function canBet(amount) {
    const user = getUser();
    return user && user.saldo >= amount;
}

export function subtractMoney(amount) {
    const user = getUser();
    if (!user || user.saldo < amount) return false;

    user.saldo -= amount;
    saveUser(user);
    return true;
}

export function addMoney(amount) {
    const user = getUser();
    if (!user) return;

    user.saldo += amount;
    saveUser(user);
}
