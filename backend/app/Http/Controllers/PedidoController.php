<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Pedido;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PedidoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Pedido::query()
            ->with(['cliente', 'items'])
            ->withCount('items');

        if ($estado = $request->query('estado')) {
            $query->where('estado', $estado);
        }

        if ($clienteId = $request->query('cliente_id')) {
            $query->where('cliente_id', $clienteId);
        }

        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        return OrderResource::collection($query->latest('id')->paginate($perPage));
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $datos     = $request->validated();
        $itemsData = $datos['items'];
        $clienteId = $request->user()?->id ?? $request->input('cliente_id');

        if (! $clienteId) {
            throw ValidationException::withMessages([
                'cliente_id' => ['Se requiere un usuario autenticado para asociar el pedido.'],
            ]);
        }

        $pedido = DB::transaction(function () use ($itemsData, $clienteId, $datos) {
            $productoIds = collect($itemsData)->pluck('producto_id')->unique()->values();

            $productos = Producto::whereIn('id', $productoIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $itemsParaInsertar = [];
            $totalCalculado    = 0.0;

            foreach ($itemsData as $item) {
                $producto = $productos->get($item['producto_id']);

                if (! $producto) {
                    throw ValidationException::withMessages([
                        'items' => ["El producto ID {$item['producto_id']} no existe."],
                    ]);
                }

                if (! $producto->activo) {
                    throw ValidationException::withMessages([
                        'items' => ["El producto '{$producto->nombre}' no está disponible."],
                    ]);
                }

                $cantidad = (int) $item['cantidad'];

                if ($producto->stock < $cantidad) {
                    throw ValidationException::withMessages([
                        'items' => ["Stock insuficiente para '{$producto->nombre}'. Disponible: {$producto->stock}."],
                    ]);
                }

                $precioUnitario = (float) $producto->precio;
                $subtotal       = round($precioUnitario * $cantidad, 2);
                $totalCalculado += $subtotal;

                $producto->decrement('stock', $cantidad);

                $itemsParaInsertar[] = [
                    'producto_id'     => $producto->id,
                    'nombre_producto' => $producto->nombre,
                    'precio_unitario' => $precioUnitario,
                    'cantidad'        => $cantidad,
                    'subtotal'        => $subtotal,
                ];
            }

            $numeroPedido = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $nuevoPedido = Pedido::create([
                'cliente_id'    => $clienteId,
                'numero_pedido' => $numeroPedido,
                'total'         => round($totalCalculado, 2),
                'estado'        => 'pendiente',
                'notas'         => $datos['notas'] ?? null,
            ]);

            foreach ($itemsParaInsertar as $itemData) {
                $nuevoPedido->items()->create($itemData);
            }

            return $nuevoPedido;
        });

        $pedido->load(['cliente', 'items']);

        return (new OrderResource($pedido))->response()->setStatusCode(201);
    }

    public function show(Pedido $pedido): OrderResource
    {
        $pedido->load(['cliente', 'items', 'pagos']);

        return new OrderResource($pedido);
    }

    public function cancelar(Pedido $pedido): JsonResponse
    {
        if ($pedido->estado === 'cancelado') {
            return response()->json(['message' => 'El pedido ya está cancelado.'], 400);
        }

        if ($pedido->estado === 'pagado') {
            return response()->json(['message' => 'No se puede cancelar un pedido pagado.'], 400);
        }

        DB::transaction(function () use ($pedido) {
            foreach ($pedido->items as $item) {
                Producto::where('id', $item->producto_id)->increment('stock', $item->cantidad);
            }

            $pedido->update(['estado' => 'cancelado']);
        });

        return response()->json([
            'message' => 'Pedido cancelado y stock restablecido.',
            'data'    => new OrderResource($pedido->fresh(['cliente', 'items', 'pagos'])),
        ]);
    }
}
