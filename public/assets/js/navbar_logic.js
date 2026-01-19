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

    // Buscamos la API de forma relativa para que funcione en cualquier nivel de carpetas
    // Si estamos en un juego (nivel 2), subimos dos niveles. Si estamos en dashboard (nivel 1), subimos uno.
    const apiPath = window.location.pathname.includes("/games/")
      ? "../../api.php"
      : "api.php";

    fetch(apiPath + "?action=get_user_info&t=" + Date.now())
      .then((response) => response.json())
      .then((data) => {
        if (data.logged_in) {
          // OCULTAR botones de Registro/Login y MOSTRAR info de usuario
          guestElements.forEach((el) => el.classList.add("d-none"));
          userElements.forEach((el) => el.classList.remove("d-none"));

          if (usernameSpan) usernameSpan.textContent = data.username;
          if (saldoSpan)
            saldoSpan.textContent = parseFloat(data.saldo).toFixed(2);

          // Configurar botón cerrar sesión
          if (btnLogout) {
            btnLogout.onclick = (e) => {
              e.preventDefault();
              fetch(apiPath + "?action=logout").then(() =>
                window.location.replace("/CasinoDaw/public/index.html")
              );
            };
          }
        } else {
          // MODO INVITADO
          guestElements.forEach((el) => el.classList.remove("d-none"));
          userElements.forEach((el) => el.classList.add("d-none"));
        }
      })
      .catch((err) =>
        console.error("Error cargando interfaz de usuario:", err)
      );
  },
};

// Auto-arranque solo si los elementos ya existen (para páginas estáticas)
if (document.getElementById("nav-username")) {
  window.NavbarManager.init();
}
