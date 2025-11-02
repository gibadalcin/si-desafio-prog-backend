import { Usuario } from '../src/domain/Usuario.js';
import { Disciplina } from '../src/domain/Disciplina.js';
import { Horario } from '../src/domain/Horario.js';
import { Turma } from '../src/domain/Turma.js';
import { Matricula } from '../src/domain/Matricula.js';

(async function () {
  const user = new Usuario({ id: 1, nome: 'Teste', email: 't@t.com', senha: 'x' });
  const d = new Disciplina({ id: 10, codigo: 'MAT101', nome: 'Matemática' });
  const h = new Horario({ id: 20, codigo: 'M1', dia: 'Segunda', inicio: '08:00', fim: '10:00' });
  const t = new Turma({ id: 30, codigo: 'T-1', nome: 'Turma 1', vagas: 2 });
  const m = new Matricula({ id: 40, aluno_id: 1, turma_id: 30 });

  console.log('Usuario safe:', user.toSafeJSON());
  console.log('Disciplina:', d.toJSON());
  console.log('Horario:', h.toJSON());
  console.log('Turma before:', t.toJSON());
  console.log('hasVagas?', t.hasVagas());
  t.ocuparVaga();
  console.log('Turma after ocuparVaga:', t.toJSON());
  console.log('Matricula active?', m.isActive());
  m.cancel();
  console.log('Matricula after cancel:', m.toJSON());
})();
