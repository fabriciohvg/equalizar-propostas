import { createClient } from "@/lib/supabase/server";
import { EqualizacaoTable } from "./EqualizacaoTable";
import type { TreeNode, Proposta, LinkedItem } from "./types";

interface EapPadraoItem {
  id: string;
  caminho: string;
  item: string;
  nivel: number;
  parent_id: string | null;
}

interface EqualizacaoData {
  eap_padrao_id: string;
  eap_proposta: {
    id: string;
    proposta_id: string;
    item_description: string | null;
    item_total_price_subtotal: number | null;
  };
}

export default async function EqualizacaoPage() {
  const supabase = await createClient();

  // Fetch reference WBS with parent_id for tree building
  const { data: eapPadrao, error: eapError } = await supabase
    .from("eap_padrao")
    .select("id, caminho, item, nivel, parent_id")
    .order("caminho_sort", { ascending: true });

  // Fetch proposals with construtora names and total value
  const { data: propostas, error: propostasError } = await supabase
    .from("propostas")
    .select("id, valor_total, construtoras (nome)")
    .order("created_at", { ascending: true });

  // Fetch equalization links with proposal item details
  const { data: equalizacao, error: equalizacaoError } = await supabase
    .from("eap_equalizacao")
    .select(`
      eap_padrao_id,
      eap_proposta (
        id,
        proposta_id,
        item_description,
        item_total_price_subtotal
      )
    `)
    .limit(10000);

  if (eapError || propostasError || equalizacaoError) {
    console.error("Errors:", { eapError, propostasError, equalizacaoError });
    return (
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Equalização de Propostas
          </h1>
          <p className="text-red-600">Erro ao carregar dados.</p>
        </div>
      </div>
    );
  }

  // Build proposals list with construtora names
  const propostasList: Proposta[] = (propostas ?? []).map((p) => ({
    id: p.id,
    construtora_nome:
      (p.construtoras as unknown as { nome: string } | null)?.nome ?? "Sem nome",
    valor_total: p.valor_total,
  }));

  // Build matrix: eap_padrao_id -> proposta_id -> linked items
  const matrix: Record<string, Record<string, LinkedItem[]>> = {};

  for (const eq of (equalizacao ?? []) as unknown as EqualizacaoData[]) {
    const eapPadraoId = eq.eap_padrao_id;
    const eapProposta = eq.eap_proposta;

    if (!eapProposta) continue;

    if (!matrix[eapPadraoId]) {
      matrix[eapPadraoId] = {};
    }

    const propostaId = eapProposta.proposta_id;
    if (!matrix[eapPadraoId][propostaId]) {
      matrix[eapPadraoId][propostaId] = [];
    }

    matrix[eapPadraoId][propostaId].push({
      id: eapProposta.id,
      item_description: eapProposta.item_description,
      item_total_price_subtotal: eapProposta.item_total_price_subtotal,
    });
  }

  // Build tree structure from flat list
  const buildTree = (items: EapPadraoItem[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create all nodes
    for (const item of items) {
      const itemsForNode = matrix[item.id] ?? {};
      const values: Record<string, { items: LinkedItem[]; total: number }> = {};

      for (const proposta of propostasList) {
        const linkedItems = itemsForNode[proposta.id] ?? [];
        const total = linkedItems.reduce(
          (sum, li) => sum + (li.item_total_price_subtotal ?? 0),
          0
        );
        values[proposta.id] = { items: linkedItems, total };
      }

      nodeMap.set(item.id, {
        id: item.id,
        caminho: item.caminho,
        item: item.item,
        nivel: item.nivel,
        children: [],
        values,
      });
    }

    // Second pass: build tree relationships
    for (const item of items) {
      const node = nodeMap.get(item.id)!;
      if (item.parent_id && nodeMap.has(item.parent_id)) {
        nodeMap.get(item.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Third pass: aggregate values up the tree (children values bubble up to parents)
    const aggregateValues = (node: TreeNode): void => {
      // First, recursively aggregate children
      for (const child of node.children) {
        aggregateValues(child);
      }

      // Then add children's values to this node's values
      for (const proposta of propostasList) {
        for (const child of node.children) {
          const childValue = child.values[proposta.id];
          if (childValue && childValue.total > 0) {
            node.values[proposta.id].total += childValue.total;
            // Don't merge items - only show direct items, total includes children
          }
        }
      }
    };

    for (const root of roots) {
      aggregateValues(root);
    }

    return roots;
  };

  // Filter to only include nodes that have values (directly or via children)
  const filterNodesWithValues = (nodes: TreeNode[]): TreeNode[] => {
    const hasValue = (node: TreeNode): boolean => {
      // Check if this node has any direct values
      const hasDirectValue = Object.values(node.values).some((v) => v.total > 0);
      // Check if any children have values
      const hasChildValue = node.children.some((child) => hasValue(child));
      return hasDirectValue || hasChildValue;
    };

    return nodes
      .filter((node) => hasValue(node))
      .map((node) => ({
        ...node,
        children: filterNodesWithValues(node.children),
      }));
  };

  const treeNodes = filterNodesWithValues(
    buildTree(eapPadrao as EapPadraoItem[])
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Equalização de Propostas
        </h1>

        {treeNodes.length > 0 ? (
          <EqualizacaoTable data={treeNodes} propostas={propostasList} />
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhum item equalizado encontrado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
