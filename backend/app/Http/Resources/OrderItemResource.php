<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'producto_id' => $this->producto_id,
            'nombre_producto' => $this->nombre_producto,
            'precio_unitario' => (float) $this->precio_unitario,
            'cantidad' => $this->cantidad,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
