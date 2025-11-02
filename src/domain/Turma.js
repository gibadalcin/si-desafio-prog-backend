/**
 * Entidade de domínio: Turma
 * - Modela campos e operações simples (vagas, ocupar/liberar vaga).
 */
export class Turma {
  constructor(data = {}) {
    this.id = data.id;
    this.codigo = data.codigo;
    this.nome = data.nome;
    this.vagas = typeof data.vagas === 'number' ? data.vagas : (data.vagas ?? 0);
    this.disciplina_id = data.disciplina_id ?? null;
    this.professor_id = data.professor_id ?? null;
    this.horario_id = data.horario_id ?? null;
    this.created_at = data.created_at ?? null;
  }

  hasVagas() {
    return typeof this.vagas === 'number' && this.vagas > 0;
  }

  ocuparVaga() {
    if (!this.hasVagas()) return false;
    this.vagas -= 1;
    return true;
  }

  liberarVaga() {
    this.vagas += 1;
    return this.vagas;
  }

  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      nome: this.nome,
      vagas: this.vagas,
      disciplina_id: this.disciplina_id,
      professor_id: this.professor_id,
      horario_id: this.horario_id,
      created_at: this.created_at,
    };
  }

  toSafeJSON() {
    return this.toJSON();
  }
}
