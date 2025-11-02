/**
 * Entidade de domínio: Matricula
 * - Representa vínculo entre aluno e turma; métodos para checar/cancelar status.
 */
export class Matricula {
  constructor(data = {}) {
    this.id = data.id;
    this.aluno_id = data.aluno_id;
    this.turma_id = data.turma_id;
    this.status = data.status ?? 'ativa'; // ativa, cancelada
    this.created_at = data.created_at ?? null;
  }

  isActive() {
    return this.status === 'ativa';
  }

  cancel() {
    if (!this.isActive()) return false;
    this.status = 'cancelada';
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      aluno_id: this.aluno_id,
      turma_id: this.turma_id,
      status: this.status,
      created_at: this.created_at,
    };
  }

  toSafeJSON() {
    return this.toJSON();
  }
}
