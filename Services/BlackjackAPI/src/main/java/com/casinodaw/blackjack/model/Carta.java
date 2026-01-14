package com.casinodaw.blackjack.model;

public class Carta {
    private String palo;  // ♥, ♦, ♠, ♣
    private String rango; // A, 2, 3... K
    private int valor;    // 1-11

    public Carta(String palo, String rango, int valor) {
        this.palo = palo;
        this.rango = rango;
        this.valor = valor;
    }

    public String getPalo() { return palo; }
    public String getRango() { return rango; }
    public int getValor() { return valor; }
}