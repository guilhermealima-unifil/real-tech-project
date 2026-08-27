import type { User } from "@/generated/prisma/client";

/**
 * Representação pública de User — usada em toda resposta de API que
 * devolve dados do usuário (register, login, me). Nunca inclui
 * `passwordHash`. Centralizado aqui para que nenhuma rota monte esse
 * objeto na mão e corra o risco de esquecer um campo sensível.
 */
export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  createdAt: string;
}

export function paraUsuarioPublico(user: User): UsuarioPublico {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
