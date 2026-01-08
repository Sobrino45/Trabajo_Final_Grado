(function () {
  const storedUser = localStorage.getItem("user");

  const guestElements = document.querySelectorAll(".guest-only");
  const userElements = document.querySelectorAll(".user-only");

  if (!storedUser) {
    guestElements.forEach(el => el.classList.remove("d-none"));
    userElements.forEach(el => el.classList.add("d-none"));
    return;
  }

  const user = JSON.parse(storedUser);

  if (!user.logged) {
    guestElements.forEach(el => el.classList.remove("d-none"));
    userElements.forEach(el => el.classList.add("d-none"));
    return;
  }

  // Usuario logueado
  guestElements.forEach(el => el.classList.add("d-none"));
  userElements.forEach(el => el.classList.remove("d-none"));

  const usernameEl = document.getElementById("nav-username");
  const saldoEl = document.getElementById("nav-saldo");

  if (usernameEl) usernameEl.textContent = user.username;
  if (saldoEl) saldoEl.textContent = user.saldo.toFixed(2);
})();
