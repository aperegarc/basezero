package com.basezero.basezero.enums;

/**
 * Qué debe adjuntar el empleado al completar la tarea (lo define el administrador).
 */
public enum TipoAdjuntoTarea {
    /** Solo marcar completada; comentario opcional. */
    NINGUNO,
    /** Subir una imagen. */
    FOTO,
    /** Subir un vídeo. */
    VIDEO
}
