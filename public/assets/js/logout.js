/* public/assets/js/logout.js */

/**
 * Función Global de Cierre de Sesión
 * 1. Borra la memoria del navegador.
 * 2. Cierra la sesión en el servidor (PHP).
 * 3. Redirige al usuario al inicio.
 */
function ejecutarCierreSesion() {
  console.log("🔒 Iniciando protocolo de cierre de sesión...");

  // 1. Borrar rastro en el navegador
  localStorage.removeItem("casino_user");

  // 2. Petición al servidor (usando ruta absoluta para evitar errores)
  fetch("/CasinoDaw/public/api.php?action=logout")
    .then(() => {
      // 3. Redirección forzosa (replace evita que vuelvan atrás)
      window.location.replace("/CasinoDaw/public/index.html");
    })
    .catch((err) => {
      console.error("Error al cerrar sesión:", err);
      // Si falla, nos vamos igual
      window.location.replace("/CasinoDaw/public/index.html");
    });
}

// AUTO-BINDING: Busca los botones de logout y les pega la función automáticamente
document.addEventListener("DOMContentLoaded", () => {
  // IDs de los botones que queremos controlar
  const botonesLogout = ["btnLogout", "btnDashboardLogout"];

  botonesLogout.forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      // TRUCO: Clonamos el botón para ELIMINAR cualquier evento antiguo/roto
      const nuevoBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(nuevoBtn, btn);

      // Le ponemos nuestra función limpia
      nuevoBtn.addEventListener("click", (e) => {
        e.preventDefault();
        ejecutarCierreSesion();
      });
      console.log(`✅ Botón de logout activado: ${id}`);
    }
  });
});
