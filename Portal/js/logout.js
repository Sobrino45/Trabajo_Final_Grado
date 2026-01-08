function logout() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return;

  const user = JSON.parse(storedUser);
  user.logged = false;

  localStorage.setItem("user", JSON.stringify(user));

  window.location.href = "login.html";
}
