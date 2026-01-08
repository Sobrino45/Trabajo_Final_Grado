(function () {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(storedUser);

  if (!user.logged) {
    window.location.href = "login.html";
  }
})();
