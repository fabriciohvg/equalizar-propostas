import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EapPropostaItem {
  id: string;
  section_id: number;
  section_name: string;
  section_total: number | null;
  item_number: string | null;
  item_code: string | null;
  item_description: string | null;
  item_quantity: number | null;
  item_unit: string | null;
  item_unit_price_material: number | null;
  item_unit_price_labor: number | null;
  item_total_price_material: number | null;
  item_total_price_labor: number | null;
  item_total_price_subtotal: number | null;
  item_order: number | null;
}

interface Proposta {
  id: string;
  data_referencia: string;
  status: string;
  valor_total: number;
  construtoras: { nome: string } | null;
  obras: { nome: string } | null;
}

export default async function PropostaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch proposal details
  const { data: proposta, error: propostaError } = await supabase
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
    .eq("id", id)
    .single();

  if (propostaError || !proposta) {
    notFound();
  }

  // Fetch proposal items
  const { data: items, error: itemsError } = await supabase
    .from("eap_proposta")
    .select("*")
    .eq("proposta_id", id)
    .order("section_id", { ascending: true })
    .order("item_order", { ascending: true });

  if (itemsError) {
    console.error("Erro ao carregar itens da proposta:", itemsError);
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const formatQuantity = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Group items by section
  const itemsBySection = (items as EapPropostaItem[] | null)?.reduce(
    (acc, item) => {
      const sectionKey = item.section_id;
      if (!acc[sectionKey]) {
        acc[sectionKey] = {
          section_id: item.section_id,
          section_name: item.section_name,
          section_total: item.section_total,
          items: [],
        };
      }
      if (item.item_description) {
        acc[sectionKey].items.push(item);
      }
      return acc;
    },
    {} as Record<
      number,
      {
        section_id: number;
        section_name: string;
        section_total: number | null;
        items: EapPropostaItem[];
      }
    >
  );

  const sections = itemsBySection ? Object.values(itemsBySection) : [];
  const typedProposta = proposta as unknown as Proposta;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/propostas"
            className="mb-4 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Voltar para propostas
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Proposta - {typedProposta.construtoras?.nome ?? "Construtora"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              <strong>Obra:</strong> {typedProposta.obras?.nome ?? "-"}
            </span>
            <span>
              <strong>Data Referência:</strong>{" "}
              {formatDate(typedProposta.data_referencia)}
            </span>
            <span>
              <strong>Valor Total:</strong>{" "}
              {formatCurrency(typedProposta.valor_total)}
            </span>
            <span>
              <strong>Status:</strong>{" "}
              <span className="capitalize">{typedProposta.status}</span>
            </span>
          </div>
        </div>

        {/* Items by Section */}
        {sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.section_id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-800"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {section.section_id}. {section.section_name}
                  </h2>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(section.section_total)}
                  </span>
                </div>

                {/* Section Items */}
                {section.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                      <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Código
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Descrição
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Qtd
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Unid
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Material
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            M.O.
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
                        {section.items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                          >
                            <td className="whitespace-nowrap px-4 py-2 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                              {item.item_number ?? "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                              {item.item_code ?? "-"}
                            </td>
                            <td className="max-w-md px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                              {item.item_description}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-zinc-600 dark:text-zinc-400">
                              {formatQuantity(item.item_quantity)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                              {item.item_unit ?? "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-zinc-600 dark:text-zinc-400">
                              {formatCurrency(item.item_total_price_material)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-zinc-600 dark:text-zinc-400">
                              {formatCurrency(item.item_total_price_labor)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {formatCurrency(item.item_total_price_subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    Seção sem itens detalhados.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhum item encontrado para esta proposta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
