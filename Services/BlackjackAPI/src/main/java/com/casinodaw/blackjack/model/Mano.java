package com.casinodaw.blackjack.model;

import java.util.ArrayList;
import java.util.List;

public class Mano {
    private List<Carta> cartas;
    private int apuesta;

    public Mano() {
        this.cartas = new ArrayList<>();
    }

    public void agregarCarta(Carta c) {
        cartas.add(c);
    }

    public int calcularPuntos() {
        int suma = 0;
        int ases = 0;

        for (Carta c : cartas) {
            suma += c.getValor();
            if (c.getRango().equals("A")) ases++;
        }

        // Si nos pasamos de 21 y tenemos ases, los convertimos en 1
        while (suma > 21 && ases > 0) {
            suma -= 10;
            ases--;
        }
        return suma;
    }

    public boolean sePaso() { return calcularPuntos() > 21; }
    
    public List<Carta> getCartas() { return cartas; }
    public int getApuesta() { return apuesta; }
    public void setApuesta(int apuesta) { this.apuesta = apuesta; }
}