/**
 * Validação de entrada de register/login — mesmo padrão de
 * src/lib/validacao.ts (função pura, sem banco, devolve { ok, erros }).
 *
 * Política de senha: não havia definição em docs/CLAUDE.md/memória do
 * projeto (busquei antes de escrever isto). Decisão adotada para o MVP,
 * mínima e sem regra de composição: comprimento entre 8 e 200 caracteres.
 * 8 é o piso comum de recomendações atuais (ex. NIST 800-63B) que preferem
 * comprimento a exigir maiúscula/número/símbolo — regra de composição não
 * necessariamente aumenta a entropia real e piora a experiência. 200 é só
 * um teto defensivo (evita mandar um payload gigante para o Argon2id).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 8;
const SENHA_MAX_LENGTH = 200;
const NOME_MIN_LENGTH = 2;

/** trim + lowercase — mesma normalização usada para gravar e para buscar,
 * senão "Fulano@Ex.com" e "fulano@ex.com" seriam tratados como e-mails
 * diferentes tanto na unicidade quanto no login. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function textoNaoVazio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

export interface EntradaRegistro {
  nome: string;
  email: string;
  password: string;
}

export type ResultadoValidacaoRegistro =
  | { ok: true; entrada: EntradaRegistro }
  | { ok: false; erros: string[] };

export function validarEntradaRegistro(body: unknown): ResultadoValidacaoRegistro {
  const erros: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, erros: ["Corpo da requisição deve ser um objeto JSON."] };
  }
  const b = body as Record<string, unknown>;

  const nome = textoNaoVazio(b.nome) ? b.nome.trim() : undefined;
  if (!nome || nome.length < NOME_MIN_LENGTH) {
    erros.push(`nome é obrigatório, com pelo menos ${NOME_MIN_LENGTH} caracteres.`);
  }

  const email = textoNaoVazio(b.email) ? normalizarEmail(b.email) : undefined;
  if (!email || !EMAIL_REGEX.test(email)) {
    erros.push("email é obrigatório e deve ter um formato válido.");
  }

  const password = typeof b.password === "string" ? b.password : undefined;
  if (!password || password.length < SENHA_MIN_LENGTH || password.length > SENHA_MAX_LENGTH) {
    erros.push(`password é obrigatório, entre ${SENHA_MIN_LENGTH} e ${SENHA_MAX_LENGTH} caracteres.`);
  }

  if (erros.length > 0) return { ok: false, erros };

  return {
    ok: true,
    entrada: { nome: nome as string, email: email as string, password: password as string },
  };
}

export interface EntradaLogin {
  email: string;
  password: string;
}

export type ResultadoValidacaoLogin =
  | { ok: true; entrada: EntradaLogin }
  | { ok: false; erros: string[] };

/**
 * Validação de login é deliberadamente mais simples que a de registro: só
 * checa presença dos dois campos. Não há necessidade de checar formato de
 * e-mail ou tamanho de senha aqui — se não bater com nenhum usuário ou não
 * verificar contra o hash, o próprio fluxo de autenticação já rejeita, e
 * validar de mais no login não evita ataque nenhum, só duplica regra.
 */
export function validarEntradaLogin(body: unknown): ResultadoValidacaoLogin {
  const erros: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, erros: ["Corpo da requisição deve ser um objeto JSON."] };
  }
  const b = body as Record<string, unknown>;

  const email = textoNaoVazio(b.email) ? normalizarEmail(b.email) : undefined;
  if (!email) erros.push("email é obrigatório.");

  const password = typeof b.password === "string" && b.password.length > 0 ? b.password : undefined;
  if (!password) erros.push("password é obrigatório.");

  if (erros.length > 0) return { ok: false, erros };

  return { ok: true, entrada: { email: email as string, password: password as string } };
}
