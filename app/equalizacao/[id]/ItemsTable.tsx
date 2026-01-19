"use client";

import { Fragment, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  ExpandedState,
} from "@tanstack/react-table";
import { Sheet } from "@/app/components/Sheet";

export interface PropostaItem {
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
}

export interface WbsLevel1Item {
  id: string;
  caminho: string;
  item: string;
}

interface ItemsTableProps {
  construtoraNome: string;
  items: PropostaItem[];
  total: number;
  borderColor: string;
  currentEapPadraoId: string;
  wbsLevel1Items: WbsLevel1Item[];
}

const columnHelper = createColumnHelper<PropostaItem>();

function ItemDetailSheet({
  item,
  isOpen,
  onClose,
  construtoraNome,
  currentEapPadraoId,
  wbsLevel1Items,
}: {
  item: PropostaItem | null;
  isOpen: boolean;
  onClose: () => void;
  construtoraNome: string;
  currentEapPadraoId: string;
  wbsLevel1Items: WbsLevel1Item[];
}) {
  const [selectedWbsId, setSelectedWbsId] = useState(currentEapPadraoId);
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

  if (!item) return null;

  const fields = [
    { label: "Seção", value: item.section_name },
    { label: "Número", value: item.item_number },
    { label: "Código", value: item.item_code },
    { label: "Descrição", value: item.item_description, fullWidth: true },
    { label: "Quantidade", value: formatQuantity(item.item_quantity) },
    { label: "Unidade", value: item.item_unit },
    { label: "Preço Unit. Material", value: formatCurrency(item.item_unit_price_material) },
    { label: "Preço Unit. M.O.", value: formatCurrency(item.item_unit_price_labor) },
    { label: "Preço Unit. Total", value: formatCurrency(item.item_unit_total_price_subtotal) },
    { label: "Total Material", value: formatCurrency(item.item_total_price_material) },
    { label: "Total M.O.", value: formatCurrency(item.item_total_price_labor) },
    { label: "Subtotal", value: formatCurrency(item.item_total_price_subtotal), highlight: true },
    { label: "Status", value: item.item_status },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={`Item - ${construtoraNome}`}>
      <div className="space-y-4">
        {/* WBS Reference Select */}
        <div>
          <label
            htmlFor="wbs-select"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Item EAP Padrão
          </label>
          <select
            id="wbs-select"
            value={selectedWbsId}
            onChange={(e) => setSelectedWbsId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {wbsLevel1Items.map((wbs) => (
              <option key={wbs.id} value={wbs.id}>
                {wbs.caminho} - {wbs.item}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-700" />

        {fields.map((field) =>
          field.value ? (
            <div
              key={field.label}
              className={field.fullWidth ? "col-span-2" : ""}
            >
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {field.label}
              </dt>
              <dd
                className={`mt-1 text-sm ${
                  field.highlight
                    ? "text-lg font-bold text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {field.value}
              </dd>
            </div>
          ) : null
        )}
      </div>
    </Sheet>
  );
}

export function ItemsTable({
  construtoraNome,
  items,
  total,
  borderColor,
  currentEapPadraoId,
  wbsLevel1Items,
}: ItemsTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedItem, setSelectedItem] = useState<PropostaItem | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

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

  const columns = [
    columnHelper.display({
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
        >
          <svg
            className={`h-3 w-3 text-zinc-400 transition-transform ${row.getIsExpanded() ? "rotate-90" : ""}`}
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
      ),
      size: 28,
    }),
    columnHelper.accessor("item_description", {
      header: () => (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Descrição
        </span>
      ),
      cell: (info) => {
        const value = info.getValue() ?? "-";
        return (
          <span
            className="block max-w-[180px] truncate text-xs text-zinc-900 dark:text-zinc-100"
            title={value}
          >
            {value}
          </span>
        );
      },
    }),
    columnHelper.accessor("item_total_price_subtotal", {
      header: () => (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Subtotal
        </span>
      ),
      cell: (info) => (
        <span className="whitespace-nowrap font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
          {formatCurrency(info.getValue())}
        </span>
      ),
      size: 100,
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const isHovered = hoveredRowId === row.id;
        return (
          <div className={`transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
              title="Ver detalhes"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        );
      },
      size: 32,
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <>
      <div
        className={`flex flex-col overflow-hidden rounded-lg border-2 bg-white shadow-sm dark:bg-zinc-800 ${borderColor}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {construtoraNome}
          </h2>
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(total)}
          </span>
        </div>

        {/* Table */}
        {items.length > 0 ? (
          <div className="flex-1 overflow-auto">
            <table className="min-w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="whitespace-nowrap px-2 py-1.5 text-left"
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-700/50 dark:hover:bg-zinc-700/30"
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-2 py-1.5">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && (
                      <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-900/50">
                        <td colSpan={columns.length} className="px-2 py-2">
                          <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            <div className="whitespace-nowrap">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                Qtd:{" "}
                              </span>
                              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                {formatQuantity(row.original.item_quantity)}{" "}
                                {row.original.item_unit ?? ""}
                              </span>
                            </div>
                            <div className="whitespace-nowrap">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                Mat:{" "}
                              </span>
                              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                {formatCurrency(row.original.item_unit_price_material)}
                              </span>
                            </div>
                            <div className="whitespace-nowrap">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                M.O.:{" "}
                              </span>
                              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                {formatCurrency(row.original.item_unit_price_labor)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Nenhum item vinculado.
            </p>
          </div>
        )}

        {/* Footer with item count */}
        {items.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          </div>
        )}
      </div>

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        construtoraNome={construtoraNome}
        currentEapPadraoId={currentEapPadraoId}
        wbsLevel1Items={wbsLevel1Items}
      />
    </>
  );
}
