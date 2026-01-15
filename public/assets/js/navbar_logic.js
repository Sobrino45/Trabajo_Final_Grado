/* public/assets/js/navbar_logic.js */

console.log("--- CARGANDO NAVBAR LOGIC (MODO SEGURO) ---");

// 1. DEFINICIÓN SEGURA: Usamos window.NavbarManager en vez de const
// Esto evita el error "Identifier has already been declared"
window.NavbarManager = {
  init: function () {
    console.log("NavbarManager: Iniciando...");
    this.updateUserInterface();
  },

  updateUserInterface: function () {
    const guestElements = document.querySelectorAll(".guest-only");
    const userElements = document.querySelectorAll(".user-only");
    const usernameSpan = document.getElementById("nav-username");
    const saldoSpan = document.getElementById("nav-saldo");
    const btnLogout = document.getElementById("btnLogout");

    // Petición al API con diagnóstico de texto
    fetch("/CasinoDaw/public/api.php?action=get_user_info")
      .then((response) => response.text()) // Leemos como TEXTO para ver errores PHP
      .then((texto) => {
        console.log("--- CHIVATO DEL SERVIDOR ---");
        console.log("Recibido:", texto); // AQUÍ VEREMOS SI HAY ESPACIOS O ERRORES

        try {
          // Intentamos convertir a JSON
          const data = JSON.parse(texto);
          console.log("Datos procesados correctamente:", data);

          if (data.logged_in) {
            // --- MODO USUARIO ---
            guestElements.forEach((el) => el.classList.add("d-none"));
            userElements.forEach((el) => el.classList.remove("d-none"));

            if (usernameSpan) usernameSpan.textContent = data.username;

            // Protección contra NaN
            let saldoFinal = parseFloat(data.saldo);
            if (isNaN(saldoFinal)) {
              console.warn(
                "El saldo recibido no es un número válido:",
                data.saldo
              );
              saldoFinal = 0.0;
            }

            if (saldoSpan) saldoSpan.textContent = saldoFinal.toFixed(2);

            // Lógica Logout
            if (btnLogout) {
              const newBtn = btnLogout.cloneNode(true);
              btnLogout.parentNode.replaceChild(newBtn, btnLogout);
              newBtn.addEventListener("click", (e) => {
                e.preventDefault();
                window.location.href =
                  "/CasinoDaw/public/api.php?action=logout";
              });
            }
          } else {
            // --- MODO INVITADO ---
            guestElements.forEach((el) => el.classList.remove("d-none"));
            userElements.forEach((el) => el.classList.add("d-none"));
          }
        } catch (e) {
          console.error(
            "❌ EL JSON ESTÁ ROTO. El servidor envió basura HTML o espacios."
          );
          console.error("Error JS:", e);
        }
      })
      .catch((err) => console.error("Error de conexión:", err));
  },
};

// 2. AUTO-ARRANQUE
// Si el documento ya cargó, iniciamos. Si no, esperamos.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    window.NavbarManager.init()
  );
} else {
  window.NavbarManager.init();
}
