"use client";

import { useEffect } from "react";
import type { EapPropostaTag } from "../types";

interface PropostaItem {
  id: string;
  item_description: string | null;
  item_quantity: number | null;
  item_unit: string | null;
  item_unit_price_material: number | null;
  item_unit_price_labor: number | null;
  item_total_price_material: number | null;
  item_total_price_labor: number | null;
  item_total_price_subtotal: number | null;
  tag: EapPropostaTag | null;
}

interface ItemSheetProps {
  item: PropostaItem | null;
  construtoraNome: string;
  onClose: () => void;
}

export function ItemSheet({ item, construtoraNome, onClose }: ItemSheetProps) {
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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  if (!item) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Detalhes do Item
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {construtoraNome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {/* Description */}
          <div className="mb-6">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Descrição
            </label>
            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {item.item_description ?? "-"}
            </p>
          </div>

          {/* Quantity & Unit */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Quantidade
              </label>
              <p className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">
                {formatQuantity(item.item_quantity)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Unidade
              </label>
              <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {item.item_unit ?? "-"}
              </p>
            </div>
          </div>

          {/* Unit Prices */}
          <div className="mb-6">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Preços Unitários
            </label>
            <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Material</span>
                <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.item_unit_price_material)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Mão de Obra</span>
                <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.item_unit_price_labor)}
                </span>
              </div>
            </div>
          </div>

          {/* Total Prices */}
          <div className="mb-6">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Preços Totais
            </label>
            <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Material</span>
                <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.item_total_price_material)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Mão de Obra</span>
                <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.item_total_price_labor)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Subtotal</span>
                <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.item_total_price_subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
