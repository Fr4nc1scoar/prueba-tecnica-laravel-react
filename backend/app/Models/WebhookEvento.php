<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebhookEvento extends Model
{
    use HasFactory;

    protected $table = 'webhook_eventos';

    protected $fillable = [
        'evento_id',
        'proveedor',
        'tipo_evento',
        'payload',
        'procesado_en',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'procesado_en' => 'datetime',
        ];
    }
}
