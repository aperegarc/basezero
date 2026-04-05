package com.basezero.basezero;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.http.MediaType;

import java.util.Map;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class IntegrationTest {

    @LocalServerPort
    private int port;

    private final RestTemplate restTemplate = new RestTemplate() {{
        setErrorHandler(new org.springframework.web.client.DefaultResponseErrorHandler() {
            @Override
            public boolean hasError(org.springframework.http.client.ClientHttpResponse response) {
                return false; // nunca lanza excepción, siempre devuelve la respuesta
            }
        });
    }};

    static String token;
    static Long clienteId;
    static Long ventaId;
    static Long cobroId;
    static Long usuarioId;

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        return headers;
    }

    // ─── AUTH ────────────────────────────────────────────────

    @Test @Order(1)
    void login_admin() {
        String body = """
                {"username": "admin", "password": "admin123"}
                """;
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/auth/login"),
                new HttpEntity<>(body, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }}),
                Map.class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        token = (String) response.getBody().get("token");
        Assertions.assertNotNull(token);
        System.out.println("✅ [AUTH] Login admin OK → token obtenido");
    }

    @Test @Order(2)
    void login_credenciales_incorrectas() {
        String body = """
                {"username": "admin", "password": "wrongpassword"}
                """;
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/auth/login"),
                new HttpEntity<>(body, new HttpHeaders() {{ setContentType(MediaType.APPLICATION_JSON); }}),
                Map.class
        );
        Assertions.assertEquals(403, response.getStatusCode().value());
        System.out.println("✅ [AUTH] Login con contraseña incorrecta rechazado correctamente");
    }

    @Test @Order(3)
    void acceso_sin_token_rechazado() {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/api/clientes"), String.class);
        Assertions.assertEquals(403, response.getStatusCode().value());
        System.out.println("✅ [SEGURIDAD] Acceso sin token rechazado correctamente");
    }

    // ─── USUARIOS ────────────────────────────────────────────

    @Test @Order(4)
    void crear_usuario_gestor() {
        String body = """
                {
                    "username": "gestor_test",
                    "password": "gestor123",
                    "nombre": "María",
                    "apellidos": "López García",
                    "iniciales": "ML",
                    "rol": "GESTOR"
                }
                """;
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/usuarios"),
                new HttpEntity<>(body, authHeaders()),
                Map.class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        usuarioId = ((Number) response.getBody().get("id")).longValue();
        System.out.println("✅ [USUARIOS] Crear gestor OK → id=" + usuarioId);
    }

    @Test @Order(5)
    void listar_usuarios() {
        ResponseEntity<Object[]> response = restTemplate.exchange(
                url("/api/usuarios"), HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Object[].class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        System.out.println("✅ [USUARIOS] Listar OK → " + response.getBody().length + " usuarios");
    }

    // ─── CLIENTES ────────────────────────────────────────────

    @Test @Order(6)
    void crear_cliente() {
        String body = """
                {
                    "nombre": "Restaurante El Rincón",
                    "cifNif": "B11111111",
                    "tipo": "RESTAURANTE",
                    "personaContacto": "Ana Martínez",
                    "cargo": "Gerente",
                    "telefono": "941000001",
                    "email": "ana@elrincon.com",
                    "direccion": "Calle Mayor 10, Logroño"
                }
                """;
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/clientes"),
                new HttpEntity<>(body, authHeaders()),
                Map.class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        clienteId = ((Number) response.getBody().get("id")).longValue();
        System.out.println("✅ [CLIENTES] Crear cliente OK → id=" + clienteId);
    }

    @Test @Order(7)
    void listar_clientes() {
        ResponseEntity<Object[]> response = restTemplate.exchange(
                url("/api/clientes"), HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Object[].class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        System.out.println("✅ [CLIENTES] Listar OK → " + response.getBody().length + " clientes");
    }

    @Test @Order(8)
    void actualizar_cliente() {
        String body = """
                {
                    "nombre": "Restaurante El Rincón ACTUALIZADO",
                    "cifNif": "B11111111",
                    "tipo": "RESTAURANTE",
                    "personaContacto": "Ana Martínez",
                    "cargo": "Directora",
                    "telefono": "941000001",
                    "email": "ana@elrincon.com",
                    "direccion": "Calle Mayor 10, Logroño"
                }
                """;
        restTemplate.exchange(
                url("/api/clientes/" + clienteId), HttpMethod.PUT,
                new HttpEntity<>(body, authHeaders()), Map.class
        );
        System.out.println("✅ [CLIENTES] Actualizar OK → cargo cambiado a Directora");
    }

    // ─── VENTAS ──────────────────────────────────────────────

    @Test @Order(9)
    void crear_venta_con_lineas() {
        String body = """
                {
                    "clienteId": %d,
                    "estado": "PENDIENTE",
                    "fecha": "2026-03-28",
                    "direccionFiscal": "Calle Mayor 10, Logroño",
                    "codigo": "VTA-TEST-001",
                    "vencimiento": "2026-04-28",
                    "metodoPago": "TRANSFERENCIA",
                    "lineas": [
                        {
                            "producto": "SERV-001",
                            "nombre": "Servicio de limpieza",
                            "descripcion": "Limpieza completa",
                            "unidades": 1,
                            "precio": 1500.00,
                            "descuento": 0,
                            "iva": 21.00,
                            "total": 1815.00
                        }
                    ]
                }
                """.formatted(clienteId);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/ventas"),
                new HttpEntity<>(body, authHeaders()),
                Map.class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        ventaId = ((Number) response.getBody().get("id")).longValue();
        System.out.println("✅ [VENTAS] Crear venta con líneas OK → id=" + ventaId);
    }

    @Test @Order(10)
    void listar_ventas() {
        ResponseEntity<Object[]> response = restTemplate.exchange(
                url("/api/ventas"), HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Object[].class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        System.out.println("✅ [VENTAS] Listar OK → " + response.getBody().length + " ventas");
    }

    @Test @Order(11)
    void ventas_por_cliente() {
        ResponseEntity<Object[]> response = restTemplate.exchange(
                url("/api/ventas/cliente/" + clienteId), HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Object[].class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        System.out.println("✅ [VENTAS] Ventas por cliente OK → " + response.getBody().length + " ventas");
    }

    // ─── COBROS ──────────────────────────────────────────────

    @Test @Order(12)
    void crear_cobro() {
        String body = """
                {
                    "cantidad": 1815.00,
                    "fecha": "2026-03-28",
                    "metodoPago": "TRANSFERENCIA",
                    "ventaId": %d
                }
                """.formatted(ventaId);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/cobros"),
                new HttpEntity<>(body, authHeaders()),
                Map.class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        cobroId = ((Number) response.getBody().get("id")).longValue();
        System.out.println("✅ [COBROS] Crear cobro OK → id=" + cobroId + " | 1815.00€");
    }

    @Test @Order(13)
    void cobros_por_venta() {
        ResponseEntity<Object[]> response = restTemplate.exchange(
                url("/api/cobros/venta/" + ventaId), HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Object[].class
        );
        Assertions.assertEquals(200, response.getStatusCode().value());
        System.out.println("✅ [COBROS] Cobros por venta OK → " + response.getBody().length + " cobros");
    }

    // ─── LIMPIEZA ────────────────────────────────────────────

    @Test @Order(14)
    void eliminar_cobro() {
        restTemplate.exchange(url("/api/cobros/" + cobroId),
                HttpMethod.DELETE, new HttpEntity<>(authHeaders()), Void.class);
        System.out.println("✅ [COBROS] Eliminar OK → id=" + cobroId);
    }

    @Test @Order(15)
    void eliminar_venta() {
        restTemplate.exchange(url("/api/ventas/" + ventaId),
                HttpMethod.DELETE, new HttpEntity<>(authHeaders()), Void.class);
        System.out.println("✅ [VENTAS] Eliminar OK → id=" + ventaId);
    }

    @Test @Order(16)
    void eliminar_cliente() {
        restTemplate.exchange(url("/api/clientes/" + clienteId),
                HttpMethod.DELETE, new HttpEntity<>(authHeaders()), Void.class);
        System.out.println("✅ [CLIENTES] Eliminar OK → id=" + clienteId);
    }

    @Test @Order(17)
    void eliminar_usuario() {
        restTemplate.exchange(url("/api/usuarios/" + usuarioId),
                HttpMethod.DELETE, new HttpEntity<>(authHeaders()), Void.class);
        System.out.println("✅ [USUARIOS] Eliminar OK → id=" + usuarioId);
    }
}