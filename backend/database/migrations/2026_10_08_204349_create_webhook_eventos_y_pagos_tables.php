<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabla para garantizar idempotencia en webhooks externos
        Schema::create('webhook_eventos', function (Blueprint $table) {
            $table->id();
            $table->string('evento_id', 100)->unique();
            $table->string('proveedor', 50)->default('pasarela');
            $table->string('tipo_evento', 100);
            $table->json('payload')->nullable();
            $table->timestamp('procesado_en')->nullable();
            $table->timestamps();
        });

        // Registro del movimiento financiero de pagos
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $table->string('transaccion_id', 100)->unique();
            $table->decimal('monto', 12, 2);
            $table->string('metodo', 50)->default('tarjeta');
            $table->string('estado', 30)->default('aprobado');
            $table->timestamps();

            $table->index('pedido_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('webhook_eventos');
    }
};
