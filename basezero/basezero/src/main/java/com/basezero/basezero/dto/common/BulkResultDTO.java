package com.basezero.basezero.dto.common;

import java.util.ArrayList;
import java.util.List;

public class BulkResultDTO<T> {

    private List<T> creados = new ArrayList<>();
    private List<BulkErrorDTO> errores = new ArrayList<>();
    private int totalCreados;
    private int totalFallidos;
    private int totalOmitidos;

    public BulkResultDTO() {}

    public void addCreado(T item) {
        creados.add(item);
        totalCreados++;
    }

    public void addError(int indice, String mensaje) {
        errores.add(new BulkErrorDTO(indice, mensaje));
        totalFallidos++;
    }

    public void addError(int indice, String identificador, String mensaje) {
        errores.add(new BulkErrorDTO(indice, identificador, mensaje));
        totalFallidos++;
    }

    public void incrementarOmitidos() { totalOmitidos++; }

    public List<T> getCreados() { return creados; }
    public void setCreados(List<T> creados) { this.creados = creados; }
    public List<BulkErrorDTO> getErrores() { return errores; }
    public void setErrores(List<BulkErrorDTO> errores) { this.errores = errores; }
    public int getTotalCreados() { return totalCreados; }
    public void setTotalCreados(int totalCreados) { this.totalCreados = totalCreados; }
    public int getTotalFallidos() { return totalFallidos; }
    public void setTotalFallidos(int totalFallidos) { this.totalFallidos = totalFallidos; }
    public int getTotalOmitidos() { return totalOmitidos; }
    public void setTotalOmitidos(int totalOmitidos) { this.totalOmitidos = totalOmitidos; }

    public static class BulkErrorDTO {
        private int indice;
        private String identificador;
        private String mensaje;

        public BulkErrorDTO() {}

        public BulkErrorDTO(int indice, String mensaje) {
            this.indice = indice;
            this.mensaje = mensaje;
        }

        public BulkErrorDTO(int indice, String identificador, String mensaje) {
            this.indice = indice;
            this.identificador = identificador;
            this.mensaje = mensaje;
        }

        public int getIndice() { return indice; }
        public void setIndice(int indice) { this.indice = indice; }
        public String getIdentificador() { return identificador; }
        public void setIdentificador(String identificador) { this.identificador = identificador; }
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    }
}
