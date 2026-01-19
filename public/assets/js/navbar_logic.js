/* public/assets/js/navbar_logic.js */

window.NavbarManager = {
  init: function () {
    this.updateUserInterface();
  },

  updateUserInterface: function () {
    const guestElements = document.querySelectorAll(".guest-only");
    const userElements = document.querySelectorAll(".user-only");
    const usernameSpan = document.getElementById("nav-username");
    const saldoSpan = document.getElementById("nav-saldo");
    const btnLogout = document.getElementById("btnLogout");

    // RUTA ABSOLUTA: Esto evita errores 404 en carpetas profundas
    const API_PATH = "/CasinoDaw/public/api.php";

    fetch(API_PATH + "?action=get_user_info&t=" + Date.now())
      .then((response) => {
        if (!response.ok) throw new Error("No se encontró api.php");
        return response.json();
      })
      .then((data) => {
        if (data.logged_in) {
          guestElements.forEach((el) => el.classList.add("d-none"));
          userElements.forEach((el) => el.classList.remove("d-none"));

          if (usernameSpan) usernameSpan.textContent = data.username;
          if (saldoSpan)
            saldoSpan.textContent = parseFloat(data.saldo).toFixed(2);

          if (btnLogout) {
            btnLogout.onclick = (e) => {
              e.preventDefault();
              fetch(API_PATH + "?action=logout").then(() => {
                window.location.replace("/CasinoDaw/public/index.html");
              });
            };
          }
        } else {
          guestElements.forEach((el) => el.classList.remove("d-none"));
          userElements.forEach((el) => el.classList.add("d-none"));
        }
      })
      .catch((err) => console.error("Error en NavbarManager:", err));
  },
};

if (
  document.getElementById("nav-username") ||
  document.getElementById("navbar")
) {
  window.NavbarManager.init();
}
