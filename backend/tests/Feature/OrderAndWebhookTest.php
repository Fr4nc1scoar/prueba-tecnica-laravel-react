<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderAndWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_auth_login_emits_valid_token_and_user_data(): void
    {
        $user = User::factory()->create([
            'email' => 'test@ejemplo.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@ejemplo.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email'],
            ]);
    }

    public function test_order_creation_calculates_total_strictly_on_backend_and_reduces_stock(): void
    {
        $user = User::factory()->create();

        $prod1 = Producto::create([
            'sku' => 'TEST-01',
            'nombre' => 'Producto Uno',
            'precio' => 50.00,
            'stock' => 10,
            'activo' => true,
        ]);

        $prod2 = Producto::create([
            'sku' => 'TEST-02',
            'nombre' => 'Producto Dos',
            'precio' => 25.50,
            'stock' => 5,
            'activo' => true,
        ]);

        // El cliente envía los items; no puede manipular el precio
        $payload = [
            'cliente_id' => $user->id,
            'items' => [
                ['producto_id' => $prod1->id, 'cantidad' => 2], // 50 * 2 = 100
                ['producto_id' => $prod2->id, 'cantidad' => 1], // 25.50 * 1 = 25.50
            ],
            'notas' => 'Prueba de cálculo exacto',
        ];

        $response = $this->postJson('/api/pedidos', $payload);

        $response->assertStatus(201);
        $this->assertEquals(125.50, (float) $response->json('data.total'));
        $this->assertEquals('pendiente', $response->json('data.estado'));

        // Verificar que el stock se descontó
        $this->assertEquals(8, $prod1->fresh()->stock);
        $this->assertEquals(4, $prod2->fresh()->stock);
    }

    public function test_payment_webhook_is_strictly_idempotent(): void
    {
        $user = User::factory()->create();

        $pedido = Pedido::create([
            'cliente_id' => $user->id,
            'numero_pedido' => 'ORD-TEST-9999',
            'total' => 100.00,
            'estado' => 'pendiente',
        ]);

        $eventoId = 'evt_test_unique_idempotency_123';

        $payload = [
            'evento_id' => $eventoId,
            'pedido_id' => $pedido->id,
            'monto' => 100.00,
            'metodo' => 'tarjeta_credito',
        ];

        // 1ª Llamada: debe marcar como pagado y registrar movimiento
        $response1 = $this->postJson('/api/webhooks/pago', $payload);

        $response1->assertStatus(200);
        $this->assertEquals('pagado', $pedido->fresh()->estado);
        $this->assertDatabaseHas('pagos', [
            'pedido_id' => $pedido->id,
            'monto' => 100.00,
        ]);
        $this->assertDatabaseHas('webhook_eventos', [
            'evento_id' => $eventoId,
        ]);

        // 2ª Llamada (webhook repetido con el mismo evento_id): debe responder 200 sin reprocesar
        $response2 = $this->postJson('/api/webhooks/pago', $payload);

        $response2->assertStatus(200);
        $this->assertTrue($response2->json('idempotente'));

        // Asegurarse de que no se duplicó el pago
        $this->assertEquals(1, \App\Models\Pago::where('pedido_id', $pedido->id)->count());
    }
}
