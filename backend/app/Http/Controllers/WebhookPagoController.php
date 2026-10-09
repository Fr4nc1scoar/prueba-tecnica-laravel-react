<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Pedido;
use App\Models\WebhookEvento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebhookPagoController extends Controller
{
    public function procesar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'evento_id'      => ['required', 'string', 'max:100'],
            'pedido_id'      => ['required'],
            'monto'          => ['nullable', 'numeric'],
            'transaccion_id' => ['nullable', 'string', 'max:100'],
            'metodo'         => ['nullable', 'string', 'max:50'],
        ]);

        $eventoId = $datos['evento_id'];

        if ($firmaRecibida = $request->header('X-Signature')) {
            $secret          = config('services.webhook.secret');
            $firmaCalculada  = hash_hmac('sha256', $request->getContent(), $secret);

            if (! hash_equals($firmaCalculada, $firmaRecibida)) {
                return response()->json(['message' => 'Firma del webhook inválida.'], 401);
            }
        }

        if (WebhookEvento::where('evento_id', $eventoId)->exists()) {
            return response()->json([
                'message'    => 'Evento ya procesado.',
                'evento_id'  => $eventoId,
                'idempotente' => true,
                'procesado'  => false,
            ]);
        }

        $resultado = DB::transaction(function () use ($datos, $eventoId, $request) {
            $query = is_numeric($datos['pedido_id'])
                ? Pedido::where('id', $datos['pedido_id'])
                : Pedido::where('numero_pedido', $datos['pedido_id']);

            $pedido = $query->lockForUpdate()->first();

            if (! $pedido) {
                return [
                    'status' => 404,
                    'data'   => ['message' => "Pedido '{$datos['pedido_id']}' no encontrado."],
                ];
            }

            if ($pedido->estado === 'pagado') {
                WebhookEvento::firstOrCreate(
                    ['evento_id' => $eventoId],
                    [
                        'proveedor'    => 'pasarela',
                        'tipo_evento'  => 'pago.confirmado',
                        'payload'      => $request->all(),
                        'procesado_en' => now(),
                    ]
                );

                return [
                    'status' => 200,
                    'data'   => [
                        'message'       => 'El pedido ya estaba pagado.',
                        'pedido_id'     => $pedido->id,
                        'numero_pedido' => $pedido->numero_pedido,
                        'estado'        => $pedido->estado,
                        'idempotente'   => true,
                    ],
                ];
            }

            $pedido->update(['estado' => 'pagado']);

            $transaccionId = $datos['transaccion_id'] ?? ('tx_' . md5($eventoId . $pedido->id));
            $monto         = $datos['monto'] ?? $pedido->total;

            Pago::create([
                'pedido_id'      => $pedido->id,
                'transaccion_id' => $transaccionId,
                'monto'          => $monto,
                'metodo'         => $datos['metodo'] ?? 'tarjeta',
                'estado'         => 'aprobado',
            ]);

            WebhookEvento::create([
                'evento_id'    => $eventoId,
                'proveedor'    => 'pasarela',
                'tipo_evento'  => 'pago.confirmado',
                'payload'      => $request->all(),
                'procesado_en' => now(),
            ]);

            return [
                'status' => 200,
                'data'   => [
                    'message'       => 'Pago confirmado y pedido actualizado.',
                    'pedido_id'     => $pedido->id,
                    'numero_pedido' => $pedido->numero_pedido,
                    'estado'        => 'pagado',
                    'idempotente'   => false,
                ],
            ];
        });

        return response()->json($resultado['data'], $resultado['status']);
    }

    public function index(): JsonResponse
    {
        $pagos = Pago::with(['pedido.cliente'])->latest('id')->paginate(15);

        return response()->json($pagos);
    }
}
