import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Rotas
import authRoutes from './routers/authRoutes.js';
import turmasRoutes from './routers/turmaRoutes.js';
import matriculaRoutes from './routers/matriculaRoutes.js';
import usuarioRoutes from './routers/usuarioRoutes.js';
import disciplinaRoutes from './routers/disciplinaRoutes.js';
import horarioRoutes from './routers/horarioRoutes.js';
import setupSwagger from './config/swagger.js';

const app = express();

// Carrega variáveis de ambiente
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Captura erros de JSON malformado enviados no body e responde 400 em vez de 500
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('JSON inválido no corpo da requisição:', err.message);
    return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
  }
  return next(err);
});
// Swagger UI (docs)
setupSwagger(app);

// Exemplo de rota de saúde/status
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Backend do Sistema de Atendimento e Matrículas rodando!',
    status: 'OK'
  });
});

// Uso das Rotas
app.use('/api/auth', authRoutes);
app.use('/api/turmas', turmasRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/disciplinas', disciplinaRoutes);
app.use('/api/horarios', horarioRoutes);
// app.use('/api/matriculas', matriculasRoutes);

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Algo deu errado no servidor!', error: err.message });
});

const PORT = Number(process.env.PORT) || 3000;

let server = null;

/**
 * Inicia o servidor com retries em caso de EADDRINUSE.
 * Faz backoff exponencial simples entre tentativas.
 */
async function startServer(port, attempts = 5) {
  return new Promise((resolve, reject) => {
    try {
      const s = app.listen(port);

      s.on('listening', () => {
        server = s;
        console.log(`Servidor Express rodando na porta ${port}`);
        resolve(s);
      });

      s.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE' && attempts > 0) {
          const nextAttempt = attempts - 1;
          const delay = (6 - attempts) * 1000; // 0s,1s,2s,3s,4s
          console.warn(`Porta ${port} ocupada, tentando novamente em ${delay / 1000}s... (${nextAttempt} tentativas restantes)`);
          // fecha o servidor que falhou (se aplicável) e aguarda antes de tentar de novo
          try { s.close(); } catch (e) { /* ignore */ }
          setTimeout(() => {
            startServer(port, nextAttempt).then(resolve).catch(reject);
          }, delay);
        } else if (err && err.code === 'EADDRINUSE') {
          // attempts esgotadas ou não desejamos retry: em dev podemos tentar porta alternativa (0 -> porta ephem)
          if (process.env.DEV_PORT_FALLBACK === '1') {
            console.warn('Porta ocupada e fallback habilitado: tentando porta ephemerally (0)...');
            try { s.close(); } catch (e) { /* ignore */ }
            const s2 = app.listen(0);
            s2.on('listening', () => {
              server = s2;
              const assigned = s2.address();
              const assignedPort = assigned && assigned.port ? assigned.port : '(desconhecida)';
              console.log(`Servidor iniciado em porta alternativa ${assignedPort}`);
              resolve(s2);
            });
            s2.on('error', (err2) => reject(err2));
          } else {
            // Erro irreversível — propaga
            reject(err);
          }
        } else {
          // Erro irreversível — propaga
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// desligamento normal
function setupGracefulShutdown() {
  const graceful = (signal) => async () => {
    console.log(`Recebido ${signal} - encerrando servidor...`);
    try {
      if (server) {
        server.close(() => {
          console.log('Servidor encerrado. Saindo.');
          process.exit(0);
        });
        // se após 5s o server não fechar, forçar exit
        setTimeout(() => {
          console.warn('Forçando encerramento do processo.');
          process.exit(1);
        }, 5000).unref();
      } else {
        process.exit(0);
      }
    } catch (e) {
      console.error('Erro durante shutdown:', e);
      process.exit(1);
    }
  };

  process.on('SIGINT', graceful('SIGINT'));
  process.on('SIGTERM', graceful('SIGTERM'));

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
  });
}

// O servidor inicia somente quando não está sendo executado dentro do Jest (para que os testes possam importar o aplicativo sem precisar ficar escutando).
if (!process.env.JEST_WORKER_ID) {
  setupGracefulShutdown();
  startServer(PORT).catch((err) => {
    console.error('Falha ao iniciar o servidor:', err);
    // Em caso de erro não recuperável, sai com código >0 para sinalizar falha
    process.exit(1);
  });
}

// Aplicativo de exportação para testes (supertest) e outras importações
export default app;

