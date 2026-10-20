/**
 * Los términos de aduana, dichos como se los explicarías a alguien.
 *
 * Quien compra medicamentos para un hospital no tiene por qué saber qué es el
 * IGI. Si la pantalla solo dice las siglas, el documento solo lo entiende
 * quien ya sabía la respuesta, y entonces no sirve de nada.
 *
 * Cada explicación cabe en un renglón a propósito: va debajo de la cifra, no
 * en una ventana aparte, porque una explicación que hay que ir a buscar es una
 * explicación que nadie lee.
 */
export const QUE_ES: Record<string, string> = {
  IGI: 'Arancel de importación',
  DTA: 'Lo que cobra la aduana por el trámite',
  IVA: 'Impuesto al valor agregado',
};

/** La frase larga, para quien quiera entender de dónde sale cada cosa. */
export const COMO_FUNCIONA: Record<string, string> = {
  IGI:
    'Lo fija la tarifa según la fracción arancelaria del producto. Muchos ' +
    'medicamentos están exentos, y los tratados comerciales pueden bajarlo más.',
  DTA:
    'Se calcula sobre el valor en aduana y se paga junto con los impuestos de ' +
    'importación.',
  IVA:
    'Se calcula sobre el valor en aduana ya con el arancel y el derecho de ' +
    'trámite encima, no sobre el precio del medicamento.',
};
