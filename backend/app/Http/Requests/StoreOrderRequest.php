<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.producto_id' => ['required', 'integer', 'exists:productos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1', 'max:500'],
            'notas' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Debe agregar al menos un producto al pedido.',
            'items.array' => 'La lista de productos tiene un formato incorrecto.',
            'items.min' => 'El pedido debe contener al menos un producto.',
            'items.*.producto_id.required' => 'El identificador del producto es obligatorio.',
            'items.*.producto_id.exists' => 'Uno de los productos seleccionados no existe.',
            'items.*.cantidad.required' => 'La cantidad es obligatoria.',
            'items.*.cantidad.integer' => 'La cantidad debe ser un número entero.',
            'items.*.cantidad.min' => 'La cantidad mínima por producto es 1.',
        ];
    }
}
