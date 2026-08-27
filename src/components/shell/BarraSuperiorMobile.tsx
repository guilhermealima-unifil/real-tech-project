import Link from "next/link";
import { MenuUsuario } from "./MenuUsuario";

/**
 * Barra superior só-mobile (abaixo de `lg:`) — marca + acesso à conta
 * (ver CLAUDE.md desta etapa, Parte 9: "pequeno botão de usuário no topo
 * da área de conteúdo", reaproveitando o mesmo MenuUsuario da Sidebar em
 * vez de um segundo sistema de conta).
 *
 * Deliberadamente NÃO `sticky`/`fixed`: rola junto com o conteúdo, como o
 * antigo Header horizontal já fazia. Isso evita duas barras competindo
 * pelo topo da tela — o header sticky de cenário/ano/abas dentro do
 * Resultado (NavegacaoAnalise.tsx) já assume o topo sozinho assim que o
 * usuário rola além desta barra, exatamente como fazia com o Header
 * antigo (mesma decisão, só que agora documentada nos dois lados).
 */
export function BarraSuperiorMobile() {
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
      <Link href="/" className="text-sm font-semibold tracking-tight text-text-primary">
        <span className="text-primary">Real</span> Tech
      </Link>
      <MenuUsuario variante="compacta" />
    </div>
  );
}
