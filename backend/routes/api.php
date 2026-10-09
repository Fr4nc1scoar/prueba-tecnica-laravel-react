<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\WebhookPagoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas de la API (RESTful)
|--------------------------------------------------------------------------
*/

// Rutas públicas de autenticación
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    // Rutas protegidas con Laravel Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// CRUD de Productos (disponible para catálogo y gestión)
Route::apiResource('productos', ProductoController::class);

// Módulo de Pedidos
Route::get('/pedidos', [PedidoController::class, 'index']);
Route::post('/pedidos', [PedidoController::class, 'store']);
Route::get('/pedidos/{pedido}', [PedidoController::class, 'show']);
Route::post('/pedidos/{pedido}/cancelar', [PedidoController::class, 'cancelar']);

// Webhook de confirmación de pagos de pasarela externa (Idempotente)
Route::post('/webhooks/pago', [WebhookPagoController::class, 'procesar']);

