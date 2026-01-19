package com.casinodaw.blackjack.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.casinodaw.blackjack.service.GameService;

@RestController
@RequestMapping("/api/blackjack")
// ¡Crucial!origins="*" permite que tu frontend en XAMPP acceda al puerto 8080 sin bloqueos de seguridad.
@CrossOrigin(origins = "*", allowedHeaders = "*") 
public class BlackjackController {

    @Autowired
    private GameService gameService;

    /**
     * Endpoint de salud: Necesario para que el Frontend verifique 
     * que el motor Java está encendido antes de apostar.
     */
    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of(
            "status", "UP",
            "message", "El motor de Blackjack Spring Boot está funcionando correctamente"
        );
    }

    @PostMapping("/start")
    public Map<String, Object> start(@RequestParam int apuesta) {
        return gameService.iniciarPartida(apuesta);
    }

    @PostMapping("/hit")
    public Map<String, Object> hit(@RequestParam String id) {
        return gameService.pedirCarta(id);
    }

    @PostMapping("/stand")
    public Map<String, Object> stand(@RequestParam String id) {
        return gameService.plantarse(id);
    }

    @PostMapping("/double")
    public Map<String, Object> doubleDown(@RequestParam String id) {
        return gameService.doblar(id);
    }
}