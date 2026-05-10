package com.basezero.basezero.dto.turno;

import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Define el horario de trabajo para un día concreto de la semana
 * dentro de una plantilla semanal.
 */
public class HorarioDiaDTO {

    @NotNull
    private DayOfWeek diaSemana;

    @NotNull
    private LocalTime horaEntrada;

    @NotNull
    private LocalTime horaSalida;

    public HorarioDiaDTO() {}

    public DayOfWeek getDiaSemana() { return diaSemana; }
    public void setDiaSemana(DayOfWeek diaSemana) { this.diaSemana = diaSemana; }
    public LocalTime getHoraEntrada() { return horaEntrada; }
    public void setHoraEntrada(LocalTime horaEntrada) { this.horaEntrada = horaEntrada; }
    public LocalTime getHoraSalida() { return horaSalida; }
    public void setHoraSalida(LocalTime horaSalida) { this.horaSalida = horaSalida; }
}
