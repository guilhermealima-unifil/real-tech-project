import { getSessionTokenFromCookie } from "@/lib/auth/cookie";
import { getSessionByToken } from "@/lib/auth/session";
import { paraUsuarioPublico, type UsuarioPublico } from "@/lib/auth/usuario";

/**
 * "Ler cookie + validar sessão + carregar usuário" num único lugar — usado
 * por GET /api/auth/me hoje. Qualquer rota protegida futura (histórico,
 * salvar simulação) deve chamar esta função em vez de repetir a leitura do
 * cookie e a checagem de expiração.
 */
export async function getUsuarioAutenticado(): Promise<UsuarioPublico | null> {
  const token = await getSessionTokenFromCookie();
  if (!token) return null;

  const resultado = await getSessionByToken(token);
  if (!resultado) return null;

  return paraUsuarioPublico(resultado.user);
}
