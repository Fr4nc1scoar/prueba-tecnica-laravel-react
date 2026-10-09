<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'numero_pedido' => $this->numero_pedido,
            'cliente_id' => $this->cliente_id,
            'cliente' => new UserResource($this->whenLoaded('cliente')),
            'total' => (float) $this->total,
            'total_formateado' => '$' . number_format((float) $this->total, 2),
            'estado' => $this->estado,
            'notas' => $this->notas,
            'items_count' => $this->whenCounted('items', $this->items_count),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
