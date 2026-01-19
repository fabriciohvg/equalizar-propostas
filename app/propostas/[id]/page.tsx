import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropostaItemsTable, EapPropostaItem } from "./PropostaItemsTable";

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
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <div>
        {/* Header */}
        <div className="mb-5">
          <Link
            href="/propostas"
            className="mb-3 inline-flex items-center text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Voltar para propostas
          </Link>
          <h1 className="text-[22px] font-semibold text-zinc-900 dark:text-zinc-50">
            Proposta - {typedProposta.construtoras?.nome ?? "Construtora"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-zinc-600 dark:text-zinc-400">
            <span>
              <span className="font-medium text-zinc-500 dark:text-zinc-500">Obra:</span>{" "}
              {typedProposta.obras?.nome ?? "-"}
            </span>
            <span>
              <span className="font-medium text-zinc-500 dark:text-zinc-500">Data Referência:</span>{" "}
              {formatDate(typedProposta.data_referencia)}
            </span>
            <span>
              <span className="font-medium text-zinc-500 dark:text-zinc-500">Valor Total:</span>{" "}
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(typedProposta.valor_total)}
              </span>
            </span>
            <span>
              <span className="font-medium text-zinc-500 dark:text-zinc-500">Status:</span>{" "}
              <span className="capitalize">{typedProposta.status}</span>
            </span>
          </div>
        </div>

        {/* Items Table */}
        <PropostaItemsTable sections={sections} />
      </div>
    </div>
  );
}
