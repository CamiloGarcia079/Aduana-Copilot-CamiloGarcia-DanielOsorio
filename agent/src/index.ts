import { assertConfig, env } from './config/env';
import { Agent } from './core/agent';
import { describirCosto } from './core/costo';
import { FakeLlmClient } from './llm/fake.client';
import { GrokClient } from './llm/grok.client';
import { ToolRegistry } from './tools/registry';
import { buscarFraccionTool } from './tools/buscar-fraccion.tool';
import { calcularCotizacionTool } from './tools/calcular-cotizacion.tool';

const EJEMPLO =
  'Necesito cotizar 500 cajas de insulina glargina desde Alemania para el ' +
  'Hospital Civil de Guadalajara. El valor de la mercancia es 50 mil dolares, ' +
  'el flete me lo cotizaron en 3 mil y el seguro en 400. El tipo de cambio ' +
  'esta en 17.50 y es medicina de patente.';

async function main(): Promise<void> {
  const peticion = process.argv.slice(2).join(' ').trim() || EJEMPLO;

  assertConfig();

  const llm = env.useFakeLlm ? new FakeLlmClient() : new GrokClient();
  const tools = new ToolRegistry();
  tools.register(buscarFraccionTool);
  tools.register(calcularCotizacionTool);

  console.log('=== Copiloto aduanal de Aduana-Copilot ===');
  console.log(`Modelo:    ${llm.name}`);
  console.log(`Gateway:   ${env.gatewayUrl}`);
  console.log(`Peticion:  ${peticion}`);

  const inicio = Date.now();
  const resultado = await new Agent(llm, tools).run(peticion);
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

  console.log('\n=== Respuesta del agente ===');
  console.log(resultado.answer);

  console.log('\n--- Resumen de la tarea ---');
  console.log(`Pasos:        ${resultado.steps}`);
  console.log(`Herramientas: ${resultado.toolsUsed.join(', ') || 'ninguna'}`);
  console.log(
    `Tokens:       ${resultado.usage.totalTokens} ` +
      `(entrada ${resultado.usage.promptTokens}, salida ${resultado.usage.completionTokens})`
  );
  console.log(`Costo:        ${describirCosto(resultado.usage)}`);
  console.log(`Duracion:     ${segundos} s`);
}

main().catch((error) => {
  console.error('\nEl agente se detuvo:', error?.message ?? error);
  process.exit(1);
});
