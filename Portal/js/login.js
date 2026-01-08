document.addEventListener("DOMContentLoaded", function () {
  const rememberedUser = localStorage.getItem("rememberedUser");
  if (rememberedUser) {
    document.getElementById("username").value = rememberedUser;
    document.getElementById("rememberUser").checked = true;
  }
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;
  const rememberUser = document.getElementById("rememberUser").checked;
  const errorElement = document.getElementById("error");

  errorElement.textContent = "";

  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    errorElement.textContent = "No existe ningún usuario registrado.";
    return;
  }

  const user = JSON.parse(storedUser);

  if (
    usernameInput !== user.username ||
    passwordInput !== user.password
  ) {
    errorElement.textContent = "Usuario o contraseña incorrectos.";
    return;
  }

  // Guardar o eliminar usuario recordado
  if (rememberUser) {
    localStorage.setItem("rememberedUser", usernameInput);
  } else {
    localStorage.removeItem("rememberedUser");
  }

  user.logged = true;
  localStorage.setItem("user", JSON.stringify(user));

  window.location.href = "dashboard.html";
});
