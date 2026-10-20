import type { ChatMessage, LlmClient, LlmReply, ToolDefinition } from './types';

/**
 * Modelo falso, para probar el ciclo del agente sin gastar credito.
 *
 * Imita lo que haria Grok con una cotizacion tipica: primero pide buscar la
 * fraccion, despues pide calcular, y al final redacta. No entiende nada de lo
 * que lee, solo cuenta cuantas veces lo han llamado, y con eso alcanza para
 * verificar que el ciclo encadena bien las herramientas y que los resultados
 * vuelven al modelo en el orden correcto.
 *
 * Se activa con AGENT_FAKE_LLM=true.
 */
export class FakeLlmClient implements LlmClient {
  readonly name = 'modelo falso (sin red)';

  private vuelta = 0;

  async chat(messages: ChatMessage[], _tools: ToolDefinition[]): Promise<LlmReply> {
    this.vuelta += 1;

    const usage = { promptTokens: 120, completionTokens: 40, totalTokens: 160 };

    if (this.vuelta === 1) {
      return {
        content: null,
        toolCalls: [
          {
            id: 'falso-1',
            name: 'buscar_fraccion',
            rawArguments: JSON.stringify({ consulta: 'insulina' }),
          },
        ],
        usage,
      };
    }

    if (this.vuelta === 2) {
      return {
        content: null,
        toolCalls: [
          {
            id: 'falso-2',
            name: 'calcular_cotizacion',
            rawArguments: JSON.stringify({
              fraccion: '3004.31.01',
              valor_mercancia_usd: 50000,
              flete_usd: 3000,
              seguro_usd: 400,
              tipo_de_cambio: 17.5,
              origen: 'Alemania',
              destino: 'Guadalajara, Jalisco',
              es_medicina_de_patente: true,
            }),
          },
        ],
        usage,
      };
    }

    // Tercera vuelta: redacta leyendo lo que devolvieron las herramientas.
    const ultimo = messages.filter((m) => m.role === 'tool').at(-1);

    return {
      content:
        'Cotizacion calculada con el modelo falso. Resultado de la herramienta:\n' +
        (ultimo?.content ?? 'sin datos') +
        '\n\nValida esta cotizacion con tu agente aduanal antes de tomar una decision de compra.',
      toolCalls: [],
      usage,
    };
  }
}
