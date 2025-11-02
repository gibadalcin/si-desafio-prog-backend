/**
 * Entidade de domínio: Disciplina
 * - Representa disciplina com código, nome e carga horária.
 */
export class Disciplina {
  constructor(data = {}) {
    this.id = data.id;
    this.codigo = data.codigo;
    this.nome = data.nome;
    this.carga_horaria = data.carga_horaria ?? null;
    this.descricao = data.descricao ?? null;
    this.created_at = data.created_at ?? null;
  }

  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      nome: this.nome,
      carga_horaria: this.carga_horaria,
      descricao: this.descricao,
      created_at: this.created_at,
    };
  }

  toSafeJSON() {
    return this.toJSON();
  }
}
