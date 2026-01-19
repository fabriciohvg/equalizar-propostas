"use client";

import { useState, useMemo, Fragment } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type CellContext,
} from "@tanstack/react-table";
import { createClient } from "@/lib/supabase/client";

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

export interface EapPropostaItem {
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
  tag: EapPropostaTag | null;
  hidden_from_equalization: boolean;
}

interface Section {
  section_id: number;
  section_name: string;
  section_total: number | null;
  items: EapPropostaItem[];
}

interface PropostaItemsTableProps {
  sections: Section[];
}

const TAG_OPTIONS: { value: EapPropostaTag; label: string }[] = [
  { value: "cortesia", label: "Cortesia" },
  { value: "estimativa", label: "Estimativa" },
  { value: "estimativa + pendência", label: "Estimativa + Pendência" },
  { value: "não cotado + sob demanda", label: "Não Cotado + Sob Demanda" },
  { value: "não cotado + pendência", label: "Não Cotado + Pendência" },
  { value: "opcional", label: "Opcional" },
  { value: "opcional + revisar escopo", label: "Opcional + Revisar Escopo" },
  { value: "revisar escopo", label: "Revisar Escopo" },
  { value: "condicional", label: "Condicional" },
];

const columnHelper = createColumnHelper<EapPropostaItem>();

function SectionRow({
  section,
  isExpanded,
  onToggle,
}: {
  section: Section;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <tr
      className="cursor-pointer border-b border-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      onClick={onToggle}
    >
      <td colSpan={10} className="px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-zinc-300 dark:hover:bg-zinc-600">
              <svg
                className={`h-4 w-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">
              {section.section_id}. {section.section_name}
            </span>
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
              ({section.items.length}{" "}
              {section.items.length === 1 ? "item" : "itens"})
            </span>
          </div>
          <span className="font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
            {formatCurrency(section.section_total)}
          </span>
        </div>
      </td>
    </tr>
  );
}

export function PropostaItemsTable({
  sections: initialSections,
}: PropostaItemsTableProps) {
  const [sections, setSections] = useState(initialSections);
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >(() => {
    // Start with all sections expanded
    const initial: Record<number, boolean> = {};
    initialSections.forEach((section) => {
      initial[section.section_id] = true;
    });
    return initial;
  });

  const handleTagChange = async (
    itemId: string,
    newTag: EapPropostaTag | null,
  ) => {
    const supabase = createClient();

    // Optimistic update
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, tag: newTag } : item,
        ),
      })),
    );

    const { error } = await supabase
      .from("eap_proposta")
      .update({ tag: newTag })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao atualizar tag:", error);
      // Revert on error
      setSections(initialSections);
    }
  };

  const handleHiddenChange = async (itemId: string, hidden: boolean) => {
    const supabase = createClient();

    // Optimistic update
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === itemId
            ? { ...item, hidden_from_equalization: hidden }
            : item,
        ),
      })),
    );

    const { error } = await supabase
      .from("eap_proposta")
      .update({ hidden_from_equalization: hidden })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao atualizar visibilidade:", error);
      // Revert on error
      setSections(initialSections);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatQuantity = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("hidden_from_equalization", {
        header: () => (
          <span
            className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            title="Ocultar da Equalização"
          >
            Oculto
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={row.original.hidden_from_equalization}
              onChange={(e) => {
                e.stopPropagation();
                handleHiddenChange(row.original.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700"
              title={
                row.original.hidden_from_equalization
                  ? "Oculto da equalização"
                  : "Visível na equalização"
              }
            />
          </div>
        ),
      }),
      columnHelper.accessor("item_number", {
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Item
          </span>
        ),
        cell: (info) => (
          <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
            {info.getValue() ?? "-"}
          </span>
        ),
      }),
      columnHelper.accessor("item_code", {
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Código
          </span>
        ),
        cell: (info) => (
          <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
            {info.getValue() ?? "-"}
          </span>
        ),
      }),
      columnHelper.accessor("item_description", {
        header: () => (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Descrição
          </span>
        ),
        cell: (info) => {
          const value = info.getValue() ?? "-";
          return (
            <span
              className="block truncate text-[13px] text-zinc-900 dark:text-zinc-100"
              title={value}
            >
              {value}
            </span>
          );
        },
      }),
      columnHelper.accessor("item_quantity", {
        header: () => (
          <span className="block text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Qtd
          </span>
        ),
        cell: (info) => (
          <span className="block text-right font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
            {formatQuantity(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("item_unit", {
        header: () => (
          <span className="block text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Unid
          </span>
        ),
        cell: (info) => (
          <span className="block text-center text-[13px] text-zinc-600 dark:text-zinc-400">
            {info.getValue() ?? "-"}
          </span>
        ),
      }),
      columnHelper.accessor("item_total_price_material", {
        header: () => (
          <span className="block text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Material
          </span>
        ),
        cell: (info) => (
          <span className="block text-right font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("item_total_price_labor", {
        header: () => (
          <span className="block text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            M.O.
          </span>
        ),
        cell: (info) => (
          <span className="block text-right font-mono text-[13px] text-zinc-600 dark:text-zinc-400">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("item_total_price_subtotal", {
        header: () => (
          <span className="block text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Subtotal
          </span>
        ),
        cell: (info) => (
          <span className="block text-right font-mono text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("tag", {
        header: () => (
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Tag
          </span>
        ),
        cell: ({ row }) => (
          <select
            value={row.original.tag ?? ""}
            onChange={(e) => {
              e.stopPropagation();
              const value = e.target.value;
              handleTagChange(
                row.original.id,
                value === "" ? null : (value as EapPropostaTag),
              );
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded border border-zinc-200 bg-white px-2 py-0.5 text-[13px] text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">-</option>
            {TAG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ),
      }),
    ],
    [handleTagChange],
  );

  // Create a flat list of items for each expanded section
  const visibleItems = useMemo(() => {
    const items: EapPropostaItem[] = [];
    sections.forEach((section) => {
      if (expandedSections[section.section_id]) {
        items.push(...section.items);
      }
    });
    return items;
  }, [sections, expandedSections]);

  const table = useReactTable({
    data: visibleItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-zinc-500 dark:text-zinc-400">
          Nenhum item encontrado para esta proposta.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px] table-fixed divide-y divide-zinc-200 dark:divide-zinc-700">
          <colgroup>
            <col className="w-[50px]" />
            <col className="w-[60px]" />
            <col className="w-[80px]" />
            <col className="min-w-[200px]" />
            <col className="w-[80px]" />
            <col className="w-[50px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[180px]" />
          </colgroup>
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2.5 text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-700 dark:bg-zinc-800">
            {sections.map((section) => {
              const isExpanded = expandedSections[section.section_id];
              const sectionItems = section.items;

              return (
                <Fragment key={section.section_id}>
                  <SectionRow
                    section={section}
                    isExpanded={isExpanded}
                    onToggle={() => toggleSection(section.section_id)}
                  />
                  {isExpanded &&
                    sectionItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                      >
                        {columns.map((column, index) => {
                          const cellValue =
                            column.accessorKey !== undefined
                              ? (item as unknown as Record<string, unknown>)[
                                  column.accessorKey as string
                                ]
                              : null;
                          const isDescription =
                            column.accessorKey === "item_description";
                          return (
                            <td
                              key={`${item.id}-${index}`}
                              className={`px-3 py-1.5 ${isDescription ? "" : "whitespace-nowrap"}`}
                            >
                              {column.cell
                                ? flexRender(
                                    column.cell as unknown as (
                                      props: CellContext<EapPropostaItem, unknown>
                                    ) => React.ReactNode,
                                    {
                                      getValue: () => cellValue,
                                      row: { original: item },
                                    } as unknown as CellContext<EapPropostaItem, unknown>
                                  )
                                : String(cellValue ?? "-")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
