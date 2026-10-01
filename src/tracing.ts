// SDK principal do OpenTelemetry para Node.js — orquestra tracing, métricas e contexto
import { NodeSDK } from '@opentelemetry/sdk-node';
// Carrega automaticamente as instrumentações padrão (HTTP, Express, fs, dns, etc.)
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// Exportador que envia as traces via OTLP over HTTP para o backend (ex.: Jaeger)
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// Helper que cria o "Resource" — metadados que identificam quem gera a telemetria
import { resourceFromAttributes } from '@opentelemetry/resources';

// Monta o SDK com três partes essenciais: identidade, destino e instrumentação
const sdk = new NodeSDK({
    // Resource: atributos estáticos anexados a TODA trace gerada por este processo.
    // O 'service.name' é o nome que aparecerá no dropdown do Jaeger.
    resource: resourceFromAttributes({
        'service.name': process.env.OTEL_SERVICE_NAME ?? 'treinamento-rag',
    }),
    // Exportador: para onde as traces terminadas são enviadas.
    // Aqui usamos o endpoint OTLP HTTP do Jaeger (porta 4318), sobrescritível
    // pela variável de ambiente OTEL_EXPORTER_OTLP_ENDPOINT.
    traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
    }),
    // Instrumentações automáticas: criam spans sem precisar tocar no código da app.
    // Ex.: cada requisição HTTP que chega no Express vira uma trace com spans
    // de middleware, router e handler automaticamente.
    instrumentations: [getNodeAutoInstrumentations()],
});

// Inicializa o SDK: registra os hooks de instrumentação e o exportador.
// Precisa rodar ANTES do Express ser carregado — por isso o script "dev"
// usa --import ./src/tracing.ts, que executa este arquivo primeiro.
sdk.start();
