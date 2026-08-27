"use client";

/**
 * Estado de autenticação no cliente — deliberadamente pequeno. O frontend
 * não valida sessão nenhuma: só guarda o que GET /api/auth/me (ou a
 * resposta de login/register) já devolveu. Nenhuma lógica de expiração,
 * token ou cookie mora aqui — isso é 100% responsabilidade do backend
 * (src/lib/auth/session.ts, src/lib/auth/cookie.ts).
 *
 * Por que um Provider (e não só um hook local por página): o Header
 * precisa saber se há usuário autenticado independente de qual página está
 * ativa, e login/cadastro precisam atualizar esse estado sem esperar um
 * novo GET /me depois de já terem a resposta em mãos — mesmo motivo que já
 * levou SimulationProvider para o layout (ver aquele arquivo). Sem
 * Provider, Header teria que buscar `/me` sozinho, duplicado do que a
 * página de login também precisaria buscar.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { UsuarioPublico } from "@/lib/auth/usuario";

type AuthStatus = "loading" | "autenticado" | "deslogado";

interface AuthContextValue {
  status: AuthStatus;
  usuario: UsuarioPublico | null;
  /** Chamado com a resposta de POST /api/auth/login ou /register — evita um GET /me redundante logo depois. */
  autenticar: (usuario: UsuarioPublico) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/auth/me")
      .then(async (resposta) => {
        if (cancelado) return;
        if (!resposta.ok) {
          setUsuario(null);
          setStatus("deslogado");
          return;
        }
        const body = await resposta.json();
        setUsuario(body.usuario);
        setStatus("autenticado");
      })
      .catch(() => {
        // Falha de rede ao descobrir a sessão: trata como deslogado — o
        // pior caso é pedir login de novo, nunca autenticar por engano.
        if (!cancelado) {
          setUsuario(null);
          setStatus("deslogado");
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const autenticar = useCallback((usuarioAutenticado: UsuarioPublico) => {
    setUsuario(usuarioAutenticado);
    setStatus("autenticado");
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Falha de rede no logout: o cookie httpOnly pode continuar existindo
      // no navegador, mas a UI não deve travar em "autenticado" por causa
      // disso — pior consequência é uma ação autenticada futura falhar com
      // 401, já tratado normalmente onde acontecer.
    }
    setUsuario(null);
    setStatus("deslogado");
  }, []);

  const value: AuthContextValue = { status, usuario, autenticar, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de <AuthProvider>.");
  }
  return context;
}
