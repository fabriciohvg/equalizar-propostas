export type EapPropostaTag =
  | "cortesia"
  | "estimativa"
  | "estimativa + pendência"
  | "não cotado + sob demanda"
  | "não cotado + pendência"
  | "opcional"
  | "opcional + revisar escopo"
  | "revisar escopo"
  | "condicional";

export interface Proposta {
  id: string;
  construtora_nome: string;
  valor_total: number;
}

export interface LinkedItem {
  id: string;
  item_description: string | null;
  item_total_price_subtotal: number | null;
  tag: EapPropostaTag | null;
}

export interface TreeNode {
  id: string;
  caminho: string;
  item: string;
  nivel: number;
  children: TreeNode[];
  // Values per proposal: proposta_id -> { items, total }
  values: Record<string, { items: LinkedItem[]; total: number }>;
}

export interface PropostaValue {
  propostaId: string;
  construtoraNome: string;
  total: number;
  items: LinkedItem[];
}
