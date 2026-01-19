import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-[28px] font-bold text-zinc-900 dark:text-zinc-50 mb-3">
          Equalização de Propostas
        </h1>
        <p className="text-[15px] text-zinc-600 dark:text-zinc-400 mb-6">
          Sistema de gestão e equalização de propostas para obras de construção civil.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/propostas"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Ver Propostas
          </Link>
          <Link
            href="/equalizacao"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-[13px] font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Equalização
          </Link>
          <Link
            href="/eap-padrao"
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-[13px] font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            EAP Padrão
          </Link>
        </div>
      </div>
    </div>
  );
}
