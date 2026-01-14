package com.casinodaw.blackjack.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.casinodaw.blackjack.service.GameService;

@RestController
@RequestMapping("/api/blackjack")
@CrossOrigin(origins = "*") // ¡Crucial! Permite que XAMPP hable con Java
public class BlackjackController {

    @Autowired
    private GameService gameService;

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