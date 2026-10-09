<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Producto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductoController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Producto::query();

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->has('activo')) {
            $query->where('activo', filter_var($request->query('activo'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        return ProductResource::collection($query->latest('id')->paginate($perPage));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $producto = Producto::create($request->validated());

        return (new ProductResource($producto))->response()->setStatusCode(201);
    }

    public function show(Producto $producto): ProductResource
    {
        return new ProductResource($producto);
    }

    public function update(UpdateProductRequest $request, Producto $producto): ProductResource
    {
        $producto->update($request->validated());

        return new ProductResource($producto);
    }

    public function destroy(Producto $producto): JsonResponse
    {
        $producto->delete();

        return response()->json(['message' => 'Producto eliminado correctamente']);
    }
}
