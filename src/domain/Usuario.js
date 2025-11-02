/**
 * Entidade de domínio: Usuario
 * - Representa usuário do sistema com roles e credenciais.
 * - `toSafeJSON()` exclui senha para respostas HTTP.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
export class Usuario {
  constructor(data) {
    // Propriedades básicas
    this.id = data.id;
    this.email = data.email;
    this.nome = data.nome;
    
    // Propriedades de segurança/papel
    this.senha = data.senha; 
    this.roles = data.roles || []; // Array de strings (ex: ['ALUNO', 'PROFESSOR'])
    
    // Propriedades de especialização (Aluno/Professor)
    this.ra = data.ra; // Registro Acadêmico (para Alunos)
    this.siape = data.siape; // SIAPE (para Professores)
  }

  /**
   * Criptografa a senha do usuário.
   * @returns {Promise<void>}
   */
  async hashPassword() {
    if (this.senha) {
      this.senha = await bcrypt.hash(this.senha, SALT_ROUNDS);
    }
  }

  /**
   * Compara uma senha em texto puro com a senha criptografada.
   * @param {string} candidatePassword - Senha a ser verificada.
   * @returns {Promise<boolean>} True se as senhas coincidirem.
   */
  async comparePassword(candidatePassword) {
    if (!this.senha) return false;
    // O 'bcrypt' precisa ser importado e usado no seu 'security/' ou 'services/'
    // Aqui estamos apenas definindo a interface do domínio.
    // Para fins práticos de implementação, importe o bcrypt no service ou repository de login.
    // Mas o princípio é que a entidade conhece como tratar sua própria senha.
    return bcrypt.compare(candidatePassword, this.senha);
  }

  /**
   * Retorna uma representação segura do usuário, sem a senha.
   * @returns {object}
   */
  toSafeJSON() {
    const { senha, ...safeData } = this;
    return safeData;
  }
}
