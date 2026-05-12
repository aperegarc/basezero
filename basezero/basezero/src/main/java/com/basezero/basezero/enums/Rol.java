package com.basezero.basezero.enums;

public enum Rol {
    ADMINISTRADOR,
    GESTOR,
    OPERARIO,
    /** Usuario de campo autenticado por DNI (tabla empleados), no tabla usuarios. */
    EMPLEADO
}