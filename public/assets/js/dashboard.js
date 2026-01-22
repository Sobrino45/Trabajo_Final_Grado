document.addEventListener("DOMContentLoaded", () => {
  // 1. Verificar Seguridad: Si no hay sesión activa en el servidor, redirigir.
  checkSession();

  // 2. Referencias al DOM
  const usernameSpan = document.getElementById("username");
  const balanceSpan = document.getElementById("saldo");
  const depositInput = document.getElementById("depositAmount");
  const btnDeposit = document.getElementById("btnDeposit");
  const achievementsContainer = document.getElementById(
    "achievements-container",
  );

  // 3. Función para verificar sesión y cargar datos iniciales del usuario
  function checkSession() {
    fetch("api.php?action=get_user_info")
      .then((r) => r.json())
      .then((data) => {
        if (!data.logged_in) {
          window.location.href = "login.html";
        } else {
          // Renderizar datos básicos
          usernameSpan.textContent = data.username;
          balanceSpan.textContent = parseFloat(data.saldo).toFixed(2);

          // Cargar componentes dinámicos
          loadAchievements();
        }
      })
      .catch((err) => console.error("Error de sesión:", err));
  }

  // 4. Función para cargar y renderizar las medallas reales
  function loadAchievements() {
    if (!achievementsContainer) return;

    fetch("api.php?action=get_achievements")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          renderMedals(data.logros);
        }
      });
  }

  // 5. Renderizado visual de logros (iluminar si están obtenidos)
  function renderMedals(logros) {
    achievementsContainer.innerHTML = ""; // Limpiar vitrina

    logros.forEach((logro) => {
      const medalDiv = document.createElement("div");
      // Si 'obtenido' es true, aplicamos clase de color, si no, escala de grises
      medalDiv.className = `col-md-2 text-center medal-item ${logro.obtenido ? "unlocked" : "locked"}`;

      medalDiv.innerHTML = `
                <div class="medal-icon shadow-sm mb-2" style="font-size: 2rem; filter: ${logro.obtenido ? "none" : "grayscale(1)"};">
                    ${logro.icono}
                </div>
                <small class="fw-bold d-block ${logro.obtenido ? "text-warning" : "text-secondary"}">
                    ${logro.nombre}
                </small>
            `;
      achievementsContainer.appendChild(medalDiv);
    });
  }

  // 6. Evento: Ingresar dinero real (Conexión con el servidor)
  if (btnDeposit) {
    btnDeposit.addEventListener("click", () => {
      const amount = parseFloat(depositInput.value);

      if (isNaN(amount) || amount <= 0) {
        alert("Por favor, introduce una cantidad válida.");
        return;
      }

      // Petición al backend para actualizar saldo y otorgar medalla "Primer Paso"
      fetch("api.php?action=deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            alert(`¡Ingreso de ${amount}€ completado!`);
            depositInput.value = "";
            // Recargar todo para ver el nuevo saldo y posibles medallas desbloqueadas
            checkSession();
          } else {
            alert("Error en la transacción: " + data.message);
          }
        });
    });
  }
});
