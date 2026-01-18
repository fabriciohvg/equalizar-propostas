import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PropostasPage() {
  const supabase = await createClient();

  const { data: propostas, error } = await supabase
    .from("propostas")
    .select(
      `
      id,
      data_referencia,
      status,
      valor_total,
      construtoras (nome),
      obras (nome)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar propostas:", error);
    return (
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Propostas Recebidas
          </h1>
          <p className="text-red-600">Erro ao carregar propostas.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      aprovada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejeitada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return statusStyles[status] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Propostas Recebidas
        </h1>

        {propostas && propostas.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Construtora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Obra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Data Referência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                {propostas.map((proposta) => (
                  <tr
                    key={proposta.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {(proposta.construtoras as unknown as { nome: string } | null)?.nome ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                      {(proposta.obras as unknown as { nome: string } | null)?.nome ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                      {formatDate(proposta.data_referencia)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(proposta.valor_total)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusBadge(proposta.status)}`}
                      >
                        {proposta.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <Link
                        href={`/propostas/${proposta.id}`}
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Ver proposta
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhuma proposta encontrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
