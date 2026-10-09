# Mini Panel de Pedidos

Panel administrativo de pedidos con API en Laravel y frontend en React Router v7 (SSR).

## Requisitos

- PHP >= 8.2 y Composer
- Node.js >= 20 y npm
- MySQL >= 8.0

## Levantar el proyecto

### Backend

```bash
cd backend
composer install
```

Revisar que el `.env` tenga la conexión a MySQL correcta:

```env
DB_CONNECTION=mysql
DB_DATABASE=prueba_tecnica
DB_USERNAME=root
DB_PASSWORD=
```

```bash
php artisan migrate --seed
php artisan serve
```

La API queda en `http://127.0.0.1:8000/api`.

Para correr los tests automatizados:

```bash
php artisan test
```

Para probar el webhook de pago directamente vía cURL:

```bash
# 1ª llamada: procesa y marca el pedido como pagado
curl -X POST http://127.0.0.1:8000/api/webhooks/pago \
  -H "Content-Type: application/json" \
  -d '{"evento_id": "evt_test_100", "pedido_id": 1, "monto": 98.75}'

# 2ª llamada (mismo evento_id): responde 200 OK idempotente sin duplicar registros
curl -X POST http://127.0.0.1:8000/api/webhooks/pago \
  -H "Content-Type: application/json" \
  -d '{"evento_id": "evt_test_100", "pedido_id": 1, "monto": 98.75}'
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir en el navegador: `http://localhost:5173`

### Credenciales de prueba

Generadas por el seeder:

- **Email:** `admin@ejemplo.com`
- **Contraseña:** `password123`

---

## Decisiones técnicas

**Autenticación SSR con cookies HttpOnly**

Al estar el frontend en modo SSR, guardar el token de Sanctum en `localStorage` no funciona en el servidor y expone el token a XSS. La solución es que al hacer login, el servidor SSR recibe el token de Laravel y lo persiste en una cookie `HttpOnly; SameSite=Lax`. Cada `loader` del servidor lee esa cookie y hace las peticiones a la API de Laravel con el header `Authorization: Bearer` — el token nunca toca el cliente.

**Cálculo de totales en backend**

El frontend solo envía `producto_id` y `cantidad`. Los precios los consulta Laravel directamente en MySQL dentro de una transacción con `lockForUpdate()`, descuenta el stock de forma atómica y calcula el total. Nunca se confía en datos financieros del cliente.

**Idempotencia del webhook**

La tabla `webhook_eventos` tiene una restricción `UNIQUE` sobre `evento_id`. Si la pasarela reenvía el mismo evento, el endpoint detecta el duplicado antes de abrir una transacción y responde `200 OK` con `idempotente: true` sin reprocesar nada.

**N+1**

Los listados cargan relaciones con Eager Loading (`with(['cliente', 'items'])`) para evitar consultas extra sin importar el volumen de resultados.

---

## Qué mejoraría con más tiempo

- Procesar el webhook en una cola (Redis + Laravel Horizon) para responder a la pasarela en menos de 20ms
- Validación de firma HMAC SHA-256 en un middleware dedicado, no en el controlador
- Reserva temporal de stock durante el checkout con TTL en Redis
- Tests E2E con Playwright para el flujo completo en el navegador
