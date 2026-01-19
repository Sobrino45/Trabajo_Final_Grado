/* public/assets/js/AudioManager.js */

window.AudioManager = {
  // RUTA ABSOLUTA: Esto asegura que funcione en cualquier subcarpeta
  basePath: "/CasinoDaw/public/assets/sounds/",

  sounds: {
    card: "card_place.mp3",
    win: "win_effect.mp3",
    loss: "loss_effect.mp3",
    chips: "chips_stack.mp3",
    click: "ui_click.mp3",
    spin: "roulette_spin.mp3",
  },
  loadedSounds: {},

  init: function () {
    console.log("Inicializando AudioManager...");
    for (let key in this.sounds) {
      // Creamos la ruta completa combinando el basePath y el nombre del archivo
      const fullPath = this.basePath + this.sounds[key];
      this.loadedSounds[key] = new Audio(fullPath);
      this.loadedSounds[key].preload = "auto";

      // Debug para ver en consola si la ruta generada es correcta
      this.loadedSounds[key].onerror = () => {
        console.error(
          `Error crítico: No se encontró el sonido '${key}' en: ${fullPath}`
        );
      };
    }
  },

  play: function (key) {
    if (this.loadedSounds[key]) {
      // Reiniciar el audio por si se pulsa rápido
      this.loadedSounds[key].currentTime = 0;
      this.loadedSounds[key].play().catch((e) => {
        // El navegador bloquea audio automático hasta que el usuario hace un clic
        console.warn(
          "Reproducción de audio bloqueada por el navegador. Esperando interacción del usuario."
        );
      });
    } else {
      console.error(`El sonido '${key}' no existe en la librería.`);
    }
  },

  setVolume: function (level) {
    for (let key in this.loadedSounds) {
      this.loadedSounds[key].volume = Math.max(0, Math.min(1, level));
    }
  },
};

// Auto-inicialización
window.AudioManager.init();
