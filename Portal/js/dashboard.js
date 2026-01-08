(function () {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  document.getElementById("username").textContent = user.username;
  document.getElementById("saldo").textContent = user.saldo.toFixed(2);

  document.getElementById("goRuleta").addEventListener("click", function () {
    window.location.href = "../RuletaJava/ruleta.html";
  });
})();
