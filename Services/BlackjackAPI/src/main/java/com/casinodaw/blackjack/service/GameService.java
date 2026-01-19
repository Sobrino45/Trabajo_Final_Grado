package com.casinodaw.blackjack.service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.casinodaw.blackjack.model.Mano;
import com.casinodaw.blackjack.model.Mazo;

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
        croupier.agregarCarta(mazo.robar());

        jugador.setApuesta(apuesta);

        Partida partida = new Partida(id, mazo, jugador, croupier);
        partidas.put(id, partida);

        // --- LÓGICA DE BLACKJACK NATURAL (21 al inicio) ---
        int ptJ = jugador.calcularPuntos();
        int ptC = croupier.calcularPuntos();

        if (ptJ == 21 && ptC == 21) {
            partida.terminada = true;
            return construirRespuesta(partida, "EMPATE");
        } else if (ptJ == 21) {
            partida.terminada = true;
            return construirRespuesta(partida, "BLACKJACK"); // Estado esperado por el JS
        } else if (ptC == 21) {
            partida.terminada = true;
            return construirRespuesta(partida, "PERDEDOR");
        }

        return construirRespuesta(partida, "JUGANDO");
    }

    public Map<String, Object> pedirCarta(String id) {
        Partida p = partidas.get(id);
        if (p == null || p.terminada)
            return error("Partida inválida o ya finalizada");

        p.jugador.agregarCarta(p.mazo.robar());

        if (p.jugador.sePaso()) {
            p.terminada = true;
            return construirRespuesta(p, "PERDEDOR");
        }

        // Si el jugador llega a 21 pidiendo carta, no gana automáticamente Blackjack
        // (es 1:1)
        // pero le obligamos a plantarse por lógica de juego.
        if (p.jugador.calcularPuntos() == 21) {
            return plantarse(id);
        }

        return construirRespuesta(p, "JUGANDO");
    }

    public Map<String, Object> plantarse(String id) {
        Partida p = partidas.get(id);
        if (p == null || p.terminada)
            return error("Partida inválida");

        // Lógica del Croupier: Solo juega si el jugador no ha perdido ya
        while (p.croupier.calcularPuntos() < 17) {
            p.croupier.agregarCarta(p.mazo.robar());
        }

        p.terminada = true;
        return determinarGanador(p);
    }

    public Map<String, Object> doblar(String id) {
        Partida p = partidas.get(id);
        if (p == null || p.terminada)
            return error("Partida inválida");

        // Regla oficial: Dobla apuesta y recibe UNA sola carta
        p.jugador.setApuesta(p.jugador.getApuesta() * 2);
        p.jugador.agregarCarta(p.mazo.robar());

        p.terminada = true;
        if (p.jugador.sePaso()) {
            return construirRespuesta(p, "PERDEDOR");
        } else {
            // El croupier debe jugar su turno tras el doble del jugador
            return plantarse(id);
        }
    }

    private Map<String, Object> determinarGanador(Partida p) {
        int ptJugador = p.jugador.calcularPuntos();
        int ptCroupier = p.croupier.calcularPuntos();
        String estado;

        if (p.croupier.sePaso()) {
            estado = "GANADOR"; // El Croupier se pasó de 21
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

        if (estado.equals("JUGANDO") && !p.terminada) {
            // Ocultamos la información sensible durante la partida
            resp.put("cartaCroupierVisible", p.croupier.getCartas().get(0));
            resp.put("puntosCroupier", 0);
        } else {
            // Se revela todo al finalizar o si hubo Blackjack inicial
            resp.put("cartasCroupier", p.croupier.getCartas());
            resp.put("puntosCroupier", p.croupier.calcularPuntos());
        }
        return resp;
    }

    private Map<String, Object> error(String msg) {
        return Map.of("error", msg);
    }

    private static class Partida {
        String id;
        Mazo mazo;
        Mano jugador, croupier;
        boolean terminada = false;

        public Partida(String id, Mazo mazo, Mano jugador, Mano croupier) {
            this.id = id;
            this.mazo = mazo;
            this.jugador = jugador;
            this.croupier = croupier;
        }
    }
}