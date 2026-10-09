<?php

namespace Database\Seeders;

use App\Models\Pago;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Producto;
use App\Models\User;
use App\Models\WebhookEvento;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with realistic test data.
     */
    public function run(): void
    {
        // 1. Usuarios de prueba
        $admin = User::firstOrCreate(
            ['email' => 'admin@ejemplo.com'],
            [
                'name' => 'Administrador de Pruebas',
                'password' => Hash::make('password123'),
            ]
        );

        $cliente = User::firstOrCreate(
            ['email' => 'cliente@ejemplo.com'],
            [
                'name' => 'Carlos Rodriguez',
                'password' => Hash::make('password123'),
            ]
        );

        $cliente2 = User::firstOrCreate(
            ['email' => 'maria@ejemplo.com'],
            [
                'name' => 'María Santander',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. Productos de catálogo inicial
        $catalogo = [
            [
                'sku' => 'PROD-KB-01',
                'nombre' => 'Teclado Mecánico RGB Custom',
                'descripcion' => 'Switches ópticos lineales, retroiluminación RGB por tecla, keycaps PBT de doble inyección.',
                'precio' => 89.99,
                'stock' => 25,
                'activo' => true,
            ],
            [
                'sku' => 'PROD-MS-02',
                'nombre' => 'Mouse Ergonómico Inalámbrico 2.4G',
                'descripcion' => 'Sensor óptico de 16000 DPI, batería recargable con autonomía de 70 horas y clicks silenciosos.',
                'precio' => 45.50,
                'stock' => 40,
                'activo' => true,
            ],
            [
                'sku' => 'PROD-MN-03',
                'nombre' => 'Monitor Gaming IPS 27" 165Hz',
                'descripcion' => 'Resolución QHD 2560x1440, tiempo de respuesta 1ms, compatibilidad FreeSync y G-Sync.',
                'precio' => 279.00,
                'stock' => 12,
                'activo' => true,
            ],
            [
                'sku' => 'PROD-HS-04',
                'nombre' => 'Auriculares Inalámbricos ANC Pro',
                'descripcion' => 'Cancelación activa de ruido híbrida, transductores de titanio de 40mm y micrófono con IA.',
                'precio' => 120.00,
                'stock' => 18,
                'activo' => true,
            ],
            [
                'sku' => 'PROD-HB-05',
                'nombre' => 'Hub USB-C 8 en 1 Aluminio',
                'descripcion' => 'HDMI 4K 60Hz, 3 puertos USB 3.2, lector SD/TF, Ethernet Gigabit y puerto PD 100W.',
                'precio' => 38.75,
                'stock' => 30,
                'activo' => true,
            ],
            [
                'sku' => 'PROD-ST-06',
                'nombre' => 'Soporte Articulado para Doble Monitor',
                'descripcion' => 'Brazos neumáticos de alta resistencia para pantallas de 17 a 32 pulgadas, gestión de cables.',
                'precio' => 64.90,
                'stock' => 15,
                'activo' => true,
            ],
        ];

        $productosCreados = [];
        foreach ($catalogo as $prod) {
            $productosCreados[] = Producto::updateOrCreate(['sku' => $prod['sku']], $prod);
        }

        // 3. Pedidos de prueba iniciales
        // Pedido 1: Pagado
        $pedido1 = Pedido::updateOrCreate(
            ['numero_pedido' => 'ORD-20261001-A101'],
            [
                'cliente_id' => $cliente->id,
                'total' => 135.49,
                'estado' => 'pagado',
                'notas' => 'Entrega en oficina antes de las 5pm.',
                'created_at' => now()->subDays(5),
            ]
        );

        PedidoItem::updateOrCreate(
            ['pedido_id' => $pedido1->id, 'producto_id' => $productosCreados[0]->id],
            [
                'nombre_producto' => $productosCreados[0]->nombre,
                'precio_unitario' => $productosCreados[0]->precio,
                'cantidad' => 1,
                'subtotal' => 89.99,
            ]
        );

        PedidoItem::updateOrCreate(
            ['pedido_id' => $pedido1->id, 'producto_id' => $productosCreados[1]->id],
            [
                'nombre_producto' => $productosCreados[1]->nombre,
                'precio_unitario' => $productosCreados[1]->precio,
                'cantidad' => 1,
                'subtotal' => 45.50,
            ]
        );

        Pago::updateOrCreate(
            ['transaccion_id' => 'tx_mock_stripe_99214'],
            [
                'pedido_id' => $pedido1->id,
                'monto' => 135.49,
                'metodo' => 'tarjeta_credito',
                'estado' => 'aprobado',
            ]
        );

        WebhookEvento::updateOrCreate(
            ['evento_id' => 'evt_test_seed_initial_01'],
            [
                'proveedor' => 'stripe',
                'tipo_evento' => 'charge.succeeded',
                'payload' => ['seed' => true, 'pedido' => 'ORD-20261001-A101'],
                'procesado_en' => now()->subDays(5),
            ]
        );

        // Pedido 2: Pendiente
        $pedido2 = Pedido::updateOrCreate(
            ['numero_pedido' => 'ORD-20261005-B202'],
            [
                'cliente_id' => $cliente2->id,
                'total' => 279.00,
                'estado' => 'pendiente',
                'notas' => 'Cliente seleccionó pago contra entrega o webhook de confirmación.',
                'created_at' => now()->subDays(2),
            ]
        );

        PedidoItem::updateOrCreate(
            ['pedido_id' => $pedido2->id, 'producto_id' => $productosCreados[2]->id],
            [
                'nombre_producto' => $productosCreados[2]->nombre,
                'precio_unitario' => $productosCreados[2]->precio,
                'cantidad' => 1,
                'subtotal' => 279.00,
            ]
        );

        // Pedido 3: Pendiente
        $pedido3 = Pedido::updateOrCreate(
            ['numero_pedido' => 'ORD-20261008-C303'],
            [
                'cliente_id' => $cliente->id,
                'total' => 103.65,
                'estado' => 'pendiente',
                'notas' => 'Pedido de accesorios periféricos.',
                'created_at' => now()->subHours(4),
            ]
        );

        PedidoItem::updateOrCreate(
            ['pedido_id' => $pedido3->id, 'producto_id' => $productosCreados[4]->id],
            [
                'nombre_producto' => $productosCreados[4]->nombre,
                'precio_unitario' => $productosCreados[4]->precio,
                'cantidad' => 1,
                'subtotal' => 38.75,
            ]
        );

        PedidoItem::updateOrCreate(
            ['pedido_id' => $pedido3->id, 'producto_id' => $productosCreados[5]->id],
            [
                'nombre_producto' => $productosCreados[5]->nombre,
                'precio_unitario' => $productosCreados[5]->precio,
                'cantidad' => 1,
                'subtotal' => 64.90,
            ]
        );
    }
}
