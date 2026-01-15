/**
 * NAVBAR LOGIC
 * Gestiona la barra de navegación: muestra saldo, nombre de usuario y botón logout.
 */

const NavbarManager = {
  init: function () {
    this.updateUserInterface();
  },

  updateUserInterface: function () {
    // Referencias a elementos del DOM
    const guestElements = document.querySelectorAll(".guest-only");
    const userElements = document.querySelectorAll(".user-only");
    const usernameSpan = document.getElementById("nav-username");
    const saldoSpan = document.getElementById("nav-saldo");
    const btnLogout = document.getElementById("btnLogout");

    // Consultar al servidor si hay sesión
    // RUTA ABSOLUTA: /CasinoDaw/public/api.php para evitar errores 404 desde subcarpetas
    fetch("/CasinoDaw/public/api.php?action=get_user_info")
      .then((response) => {
        if (!response.ok) throw new Error("Error de red");
        return response.json();
      })
      .then((data) => {
        if (data.logged_in) {
          // --- MODO USUARIO ---
          guestElements.forEach((el) => el.classList.add("d-none"));
          userElements.forEach((el) => el.classList.remove("d-none"));

          if (usernameSpan) usernameSpan.textContent = data.username;
          if (saldoSpan)
            saldoSpan.textContent = parseFloat(data.saldo).toFixed(2);

          // Configurar Logout
          if (btnLogout) {
            // Clonar para limpiar eventos anteriores
            const newBtn = btnLogout.cloneNode(true);
            btnLogout.parentNode.replaceChild(newBtn, btnLogout);

            newBtn.addEventListener("click", (e) => {
              e.preventDefault();
              if (typeof Auth !== "undefined") Auth.logout();
              else window.location.href = "/CasinoDaw/public/login.html";
            });
          }
        } else {
          // --- MODO INVITADO ---
          guestElements.forEach((el) => el.classList.remove("d-none"));
          userElements.forEach((el) => el.classList.add("d-none"));
        }
      })
      .catch((err) => {
        console.warn("No hay sesión activa o error de conexión:", err);
        // Por defecto mostramos modo invitado si falla
        guestElements.forEach((el) => el.classList.remove("d-none"));
        userElements.forEach((el) => el.classList.add("d-none"));
      });
  },
};

// Exponer globalmente
window.NavbarManager = NavbarManager;
