package com.basezero.basezero.scheduler;

import com.basezero.basezero.entity.ContratoRecurrente;
import com.basezero.basezero.repository.ContratoRepository;
import com.basezero.basezero.service.ContratoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ContratoScheduler {

    private static final Logger log = LoggerFactory.getLogger(ContratoScheduler.class);

    private final ContratoRepository contratoRepository;
    private final ContratoService contratoService;

    public ContratoScheduler(ContratoRepository contratoRepository, ContratoService contratoService) {
        this.contratoRepository = contratoRepository;
        this.contratoService = contratoService;
    }

    // Ejecuta cada día a las 8:00
    @Scheduled(cron = "0 0 8 * * *")
    public void generarVentasRecurrentes() {
        LocalDate hoy = LocalDate.now();
        int diaHoy = hoy.getDayOfMonth();

        log.info("⏰ Revisando contratos recurrentes para el día {}...", hoy);

        List<ContratoRecurrente> contratos = contratoRepository.findByActivoTrue();
        int generadas = 0;

        for (ContratoRecurrente contrato : contratos) {
            try {
                // Solo si hoy es el día de generación
                if (contrato.getDiaGeneracion() != diaHoy) continue;

                // Solo si no se ha generado ya este mes
                LocalDate ultima = contrato.getUltimaGeneracion();
                if (ultima != null &&
                        ultima.getMonth() == hoy.getMonth() &&
                        ultima.getYear() == hoy.getYear()) continue;

                contratoService.generarVenta(contrato.getId());
                generadas++;
                log.info("✅ Venta generada para contrato '{}' (cliente: {})",
                        contrato.getNombre(), contrato.getCliente().getNombre());

            } catch (Exception e) {
                log.error("❌ Error generando venta para contrato {}: {}",
                        contrato.getId(), e.getMessage());
            }
        }

        log.info("📊 Generación completada: {} ventas creadas", generadas);
    }
}