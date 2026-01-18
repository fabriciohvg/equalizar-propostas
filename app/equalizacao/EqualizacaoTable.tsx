"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  ExpandedState,
  Row,
} from "@tanstack/react-table";
import type { TreeNode, Proposta } from "./types";

interface EqualizacaoTableProps {
  data: TreeNode[];
  propostas: Proposta[];
}

const columnHelper = createColumnHelper<TreeNode>();

function ComparisonBar({
  total,
  maxValue,
  isLowest,
  isHighest,
}: {
  total: number;
  maxValue: number;
  isLowest: boolean;
  isHighest: boolean;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const barWidth = maxValue > 0 ? (total / maxValue) * 100 : 0;

  const getBarColor = () => {
    if (total === 0) return "bg-zinc-200 dark:bg-zinc-700";
    if (isLowest) return "bg-emerald-500 dark:bg-emerald-600";
    if (isHighest) return "bg-rose-500 dark:bg-rose-600";
    return "bg-amber-500 dark:bg-amber-600";
  };

  const getTextColor = () => {
    if (total === 0) return "text-zinc-400 dark:text-zinc-500";
    if (isLowest) return "text-emerald-700 dark:text-emerald-400";
    if (isHighest) return "text-rose-700 dark:text-rose-400";
    return "text-zinc-900 dark:text-zinc-100";
  };

  if (total === 0) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-sm text-zinc-400 dark:text-zinc-500">-</div>
        <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-sm font-medium ${getTextColor()}`}>
        {formatCurrency(total)}
      </span>
      <div className="relative h-4 w-full rounded bg-zinc-100 dark:bg-zinc-700">
        <div
          className={`h-full rounded transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

export function EqualizacaoTable({ data, propostas }: EqualizacaoTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>(() => {
    // Start with level 1 nodes expanded
    const initial: Record<string, boolean> = {};
    data.forEach((node, index) => {
      if (node.nivel === 1) {
        initial[index.toString()] = true;
      }
    });
    return initial;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Create columns dynamically based on propostas
  const columns = useMemo(() => {
    const cols = [
      columnHelper.display({
        id: "eapPadrao",
        header: () => (
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            EAP Padrão
          </span>
        ),
        cell: ({ row }) => {
          const node = row.original;
          const depth = row.depth;
          const canExpand = row.getCanExpand();

          return (
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              {canExpand ? (
                <button
                  onClick={row.getToggleExpandedHandler()}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
                >
                  <svg
                    className={`h-4 w-4 text-zinc-500 transition-transform ${row.getIsExpanded() ? "rotate-90" : ""}`}
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
              ) : (
                <div className="w-5 shrink-0" />
              )}
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {node.caminho}
              </span>
              <span className="truncate text-sm">{node.item}</span>
            </div>
          );
        },
        size: 300,
      }),
    ];

    // Add a column for each proposta
    propostas.forEach((proposta) => {
      cols.push(
        columnHelper.display({
          id: `proposta-${proposta.id}`,
          header: () => (
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {proposta.construtora_nome}
            </span>
          ),
          cell: ({ row }) => {
            const node = row.original;
            const total = node.values[proposta.id]?.total ?? 0;

            // Calculate min/max across all proposals for this row
            const allTotals = propostas
              .map((p) => node.values[p.id]?.total ?? 0)
              .filter((v) => v > 0);
            const maxValue = Math.max(...allTotals, 0);
            const minValue = Math.min(...allTotals, Infinity);

            return (
              <ComparisonBar
                total={total}
                maxValue={maxValue}
                isLowest={total === minValue && total > 0}
                isHighest={total === maxValue && allTotals.length > 1}
              />
            );
          },
          size: 200,
        })
      );
    });

    // Add actions column
    cols.push(
      columnHelper.display({
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const node = row.original;
          // Check if this node has any directly linked items
          const hasLinkedItems = Object.values(node.values).some(
            (v) => v.items.length > 0
          );

          if (!hasLinkedItems) return null;

          return (
            <Link
              href={`/equalizacao/${node.id}`}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            >
              <svg
                className="h-4 w-4"
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
              Detalhes
            </Link>
          );
        },
        size: 100,
      })
    );

    return cols;
  }, [propostas]);

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const getRowStyles = (row: Row<TreeNode>) => {
    const nivel = row.original.nivel;
    const styles: Record<number, string> = {
      1: "bg-zinc-100 dark:bg-zinc-800 font-semibold",
      2: "bg-zinc-50 dark:bg-zinc-800/50 font-medium",
      3: "bg-white dark:bg-zinc-900/50",
      4: "bg-white dark:bg-zinc-900/30",
    };
    return styles[nivel] || styles[4];
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-emerald-500" />
          <span>Menor valor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-amber-500" />
          <span>Valor intermediário</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-rose-500" />
          <span>Maior valor</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {propostas.map((proposta) => (
          <div
            key={proposta.id}
            className="min-w-[180px] shrink-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {proposta.construtora_nome}
            </div>
            <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(proposta.valor_total)}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-800">
        <table className="min-w-full">
          <thead className="border-b border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left ${index === 0 ? "min-w-[300px]" : "min-w-[200px]"} ${index > 0 ? "border-l border-zinc-300 dark:border-zinc-600" : ""}`}
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
          <tbody className="max-h-[600px] overflow-y-auto">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-zinc-200 dark:border-zinc-700 ${getRowStyles(row)} hover:bg-zinc-50 dark:hover:bg-zinc-700/30`}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={`px-4 py-2 ${index > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
