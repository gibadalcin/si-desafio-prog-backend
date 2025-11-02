/**
 * Entidade de domínio: Horario
 * - Modela dia, início e fim; usado para detectar conflitos de horário.
 */
export class Horario {
  constructor(data = {}) {
    this.id = data.id;
    this.codigo = data.codigo;
    this.dia = data.dia; // ex: 'Segunda'
    this.inicio = data.inicio; // ex: '08:00'
    this.fim = data.fim; // ex: '10:00'
    this.created_at = data.created_at ?? null;
  }

  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      dia: this.dia,
      inicio: this.inicio,
      fim: this.fim,
      created_at: this.created_at,
    };
  }

  toSafeJSON() {
    return this.toJSON();
  }
}
