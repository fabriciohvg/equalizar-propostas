import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemsTable } from "./ItemsTable";

interface EapPadraoItem {
  id: string;
  caminho: string;
  item: string;
  nivel: number;
}

interface PropostaItem {
  id: string;
  item_number: string | null;
  item_code: string | null;
  item_description: string | null;
  item_quantity: number | null;
  item_unit: string | null;
  item_unit_price_material: number | null;
  item_unit_price_labor: number | null;
  item_unit_total_price_subtotal: number | null;
  item_total_price_material: number | null;
  item_total_price_labor: number | null;
  item_total_price_subtotal: number | null;
  item_status: string | null;
  section_name: string | null;
  proposta_id: string;
}

interface Proposta {
  id: string;
  construtora_nome: string;
}

export default async function EqualizacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the EAP Padrão item
  const { data: eapPadrao, error: eapError } = await supabase
    .from("eap_padrao")
    .select("id, caminho, item, nivel")
    .eq("id", id)
    .single();

  if (eapError || !eapPadrao) {
    notFound();
  }

  // Fetch proposals with construtora names
  const { data: propostas, error: propostasError } = await supabase
    .from("propostas")
    .select("id, construtoras (nome)")
    .order("created_at", { ascending: true });

  if (propostasError) {
    console.error("Error fetching propostas:", propostasError);
  }

  // Fetch level 1 WBS items for the select dropdown
  const { data: wbsLevel1Items, error: wbsError } = await supabase
    .from("eap_padrao")
    .select("id, caminho, item")
    .eq("nivel", 1)
    .order("caminho", { ascending: true });

  if (wbsError) {
    console.error("Error fetching WBS level 1 items:", wbsError);
  }

  // Fetch linked items from eap_equalizacao
  const { data: equalizacao, error: equalizacaoError } = await supabase
    .from("eap_equalizacao")
    .select(`
      eap_proposta (
        id,
        proposta_id,
        item_number,
        item_code,
        item_description,
        item_quantity,
        item_unit,
        item_unit_price_material,
        item_unit_price_labor,
        item_unit_total_price_subtotal,
        item_total_price_material,
        item_total_price_labor,
        item_total_price_subtotal,
        item_status,
        section_name
      )
    `)
    .eq("eap_padrao_id", id);

  if (equalizacaoError) {
    console.error("Error fetching equalizacao:", equalizacaoError);
  }

  // Build proposals list
  const propostasList: Proposta[] = (propostas ?? []).map((p) => ({
    id: p.id,
    construtora_nome:
      (p.construtoras as unknown as { nome: string } | null)?.nome ?? "Sem nome",
  }));

  // Group items by proposta
  const itemsByProposta: Record<string, PropostaItem[]> = {};

  for (const eq of equalizacao ?? []) {
    const eapProposta = eq.eap_proposta as unknown as PropostaItem | null;
    if (!eapProposta) continue;

    const propostaId = eapProposta.proposta_id;
    if (!itemsByProposta[propostaId]) {
      itemsByProposta[propostaId] = [];
    }
    itemsByProposta[propostaId].push(eapProposta);
  }

  // Calculate totals per proposta
  const getTotalForProposta = (propostaId: string) => {
    const items = itemsByProposta[propostaId] ?? [];
    return items.reduce(
      (sum, item) => sum + (item.item_total_price_subtotal ?? 0),
      0
    );
  };

  // Find min/max totals for color coding
  const totals = propostasList
    .map((p) => getTotalForProposta(p.id))
    .filter((t) => t > 0);
  const minTotal = Math.min(...totals, Infinity);
  const maxTotal = Math.max(...totals, 0);

  const getBorderColor = (total: number) => {
    if (total === 0) return "border-zinc-200 dark:border-zinc-700";
    if (total === minTotal) return "border-emerald-500 dark:border-emerald-600";
    if (total === maxTotal && totals.length > 1)
      return "border-rose-500 dark:border-rose-600";
    return "border-amber-500 dark:border-amber-600";
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/equalizacao"
            className="mb-4 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Voltar para equalização
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Detalhes do Item
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="rounded bg-zinc-200 px-2 py-1 font-mono text-sm text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
              {(eapPadrao as EapPadraoItem).caminho}
            </span>
            <span className="text-lg text-zinc-900 dark:text-zinc-100">
              {(eapPadrao as EapPadraoItem).item}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border-2 border-emerald-500" />
            <span>Menor valor</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border-2 border-amber-500" />
            <span>Valor intermediário</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded border-2 border-rose-500" />
            <span>Maior valor</span>
          </div>
        </div>

        {/* Tables side by side */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {propostasList.map((proposta) => {
            const items = itemsByProposta[proposta.id] ?? [];
            const total = getTotalForProposta(proposta.id);

            return (
              <div key={proposta.id} className="min-w-[350px] flex-1">
                <ItemsTable
                  construtoraNome={proposta.construtora_nome}
                  items={items}
                  total={total}
                  borderColor={getBorderColor(total)}
                  currentEapPadraoId={id}
                  wbsLevel1Items={wbsLevel1Items ?? []}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
