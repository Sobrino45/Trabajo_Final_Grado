package com.casinodaw.blackjack.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Mazo {
    private List<Carta> cartas;

    public Mazo() {
        this.cartas = new ArrayList<>();
        inicializar();
    }

    private void inicializar() {
        String[] palos = {"♥", "♦", "♠", "♣"};
        String[] rangos = {"2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"};

        for (String palo : palos) {
            for (String rango : rangos) {
                int valor = 0;
                if (rango.matches("\\d+")) {
                    valor = Integer.parseInt(rango);
                } else if (rango.equals("A")) {
                    valor = 11; // Por defecto 11, se ajusta en Mano
                } else {
                    valor = 10; // Figuras
                }
                cartas.add(new Carta(palo, rango, valor));
            }
        }
        Collections.shuffle(cartas);
    }

    public Carta robar() {
        if (cartas.isEmpty()) inicializar(); // Barajar de nuevo si se acaban
        return cartas.remove(0);
    }
}