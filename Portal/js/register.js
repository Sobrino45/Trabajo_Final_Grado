document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const saldo = Number(document.getElementById("saldo").value);

  const errorElement = document.getElementById("error");
  errorElement.textContent = "";

  // Validaciones UX
  if (!username) {
    errorElement.textContent = "El usuario es obligatorio.";
    return;
  }

  if (!password || password.length < 4) {
    errorElement.textContent = "La contraseña debe tener al menos 4 caracteres.";
    return;
  }

  if (password !== confirmPassword) {
    errorElement.textContent = "Las contraseñas no coinciden.";
    return;
  }

  if (isNaN(saldo) || saldo < 10 || saldo > 10000) {
    errorElement.textContent = "El saldo debe estar entre 10 y 10.000 €.";
    return;
  }

  // Comprobar si ya existe usuario
  if (localStorage.getItem("user")) {
    errorElement.textContent = "Ya existe un usuario registrado.";
    return;
  }

  const user = {
    username: username,
    password: password,
    saldo: saldo,
    logged: false
  };

  localStorage.setItem("user", JSON.stringify(user));

  // Registro ≠ login
  window.location.href = "login.html";
});
