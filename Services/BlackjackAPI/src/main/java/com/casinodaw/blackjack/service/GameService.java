package com.casinodaw.blackjack.service;

import com.casinodaw.blackjack.model.Carta;
import com.casinodaw.blackjack.model.Mano;
import com.casinodaw.blackjack.model.Mazo;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class GameService {

    // Memoria temporal de partidas activas
    private Map<String, Partida> partidas = new HashMap<>();

    public Map<String, Object> iniciarPartida(int apuesta) {
        String id = UUID.randomUUID().toString();
        Mazo mazo = new Mazo();
        Mano jugador = new Mano();
        Mano croupier = new Mano();

        // Reparto inicial: Jugador(2), Croupier(2)
        jugador.agregarCarta(mazo.robar());
        croupier.agregarCarta(mazo.robar());
        jugador.agregarCarta(mazo.robar());
        croupier.agregarCarta(mazo.robar()); // Esta segunda se ocultará al front

        jugador.setApuesta(apuesta);

        Partida partida = new Partida(id, mazo, jugador, croupier);
        partidas.put(id, partida);

        return construirRespuesta(partida, "JUGANDO");
    }

    public Map<String, Object> pedirCarta(String id) {
        Partida p = partidas.get(id);
        if (p == null || p.terminada) return error("Partida inválida");

        p.jugador.agregarCarta(p.mazo.robar());

        if (p.jugador.sePaso()) {
            p.terminada = true;
            return construirRespuesta(p, "PERDEDOR");
        }
        return construirRespuesta(p, "JUGANDO");
    }

    public Map<String, Object> plantarse(String id) {
        Partida p = partidas.get(id);
        if (p == null) return error("Partida inválida");

        // Lógica del Croupier: Pide hasta llegar a 17
        while (p.croupier.calcularPuntos() < 17) {
            p.croupier.agregarCarta(p.mazo.robar());
        }

        p.terminada = true;
        return determinarGanador(p);
    }

    public Map<String, Object> doblar(String id) {
        Partida p = partidas.get(id);
        if (p == null) return error("Partida inválida");

        // Dobla la apuesta y da SOLO una carta
        p.jugador.setApuesta(p.jugador.getApuesta() * 2);
        p.jugador.agregarCarta(p.mazo.robar());

        if (p.jugador.sePaso()) {
            p.terminada = true;
            return construirRespuesta(p, "PERDEDOR");
        } else {
            // Si no se pasa, se planta automáticamente
            return plantarse(id);
        }
    }

    // --- Auxiliares ---

    private Map<String, Object> determinarGanador(Partida p) {
        int ptJugador = p.jugador.calcularPuntos();
        int ptCroupier = p.croupier.calcularPuntos();
        String estado;

        if (p.croupier.sePaso()) {
            estado = "GANADOR"; // Croupier se pasó
        } else if (ptJugador > ptCroupier) {
            estado = "GANADOR";
        } else if (ptJugador < ptCroupier) {
            estado = "PERDEDOR";
        } else {
            estado = "EMPATE";
        }
        return construirRespuesta(p, estado);
    }

    private Map<String, Object> construirRespuesta(Partida p, String estado) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", p.id);
        resp.put("cartasJugador", p.jugador.getCartas());
        resp.put("puntosJugador", p.jugador.calcularPuntos());
        resp.put("apuesta", p.jugador.getApuesta());
        resp.put("estado", estado);

        if (estado.equals("JUGANDO")) {
            // Ocultamos la segunda carta del croupier y sus puntos totales
            resp.put("cartaCroupierVisible", p.croupier.getCartas().get(0));
            resp.put("puntosCroupier", "?");
        } else {
            // Mostramos todo al terminar
            resp.put("cartasCroupier", p.croupier.getCartas());
            resp.put("puntosCroupier", p.croupier.calcularPuntos());
        }
        return resp;
    }

    private Map<String, Object> error(String msg) { return Map.of("error", msg); }

    private static class Partida {
        String id;
        Mazo mazo;
        Mano jugador, croupier;
        boolean terminada = false;
        public Partida(String id, Mazo mazo, Mano jugador, Mano croupier) {
            this.id = id; this.mazo = mazo; this.jugador = jugador; this.croupier = croupier;
        }
    }
}