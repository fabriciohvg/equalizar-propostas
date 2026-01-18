import { createClient } from "@/lib/supabase/server";

interface EapPadraoItem {
  id: string;
  caminho: string;
  item: string;
  nivel: number;
}

export default async function EapPadraoPage() {
  const supabase = await createClient();

  const { data: eapItems, error } = await supabase
    .from("eap_padrao")
    .select("id, caminho, item, nivel")
    .order("caminho_sort", { ascending: true });

  if (error) {
    console.error("Erro ao carregar EAP padrão:", error);
    return (
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            EAP Padrão
          </h1>
          <p className="text-red-600">Erro ao carregar EAP padrão.</p>
        </div>
      </div>
    );
  }

  const getLevelStyles = (nivel: number) => {
    const paddingLeft = (nivel - 1) * 24;
    const styles: Record<number, string> = {
      1: "font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800",
      2: "font-semibold text-zinc-800 dark:text-zinc-100",
      3: "font-medium text-zinc-700 dark:text-zinc-200",
      4: "text-zinc-600 dark:text-zinc-300",
    };
    return {
      paddingLeft: `${paddingLeft}px`,
      className: styles[nivel] || styles[4],
    };
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          EAP Padrão
        </h1>

        {eapItems && eapItems.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-800">
            <table className="min-w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Item
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Nível
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {(eapItems as EapPadraoItem[]).map((eap) => {
                  const levelStyle = getLevelStyles(eap.nivel);
                  return (
                    <tr
                      key={eap.id}
                      className={`${levelStyle.className} hover:bg-zinc-50 dark:hover:bg-zinc-700/50`}
                    >
                      <td className="whitespace-nowrap px-6 py-3 text-sm font-mono">
                        {eap.caminho}
                      </td>
                      <td
                        className="px-6 py-3 text-sm"
                        style={{ paddingLeft: `${24 + (eap.nivel - 1) * 24}px` }}
                      >
                        {eap.item}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-center text-sm">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs dark:bg-zinc-600">
                          {eap.nivel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhum item de EAP padrão encontrado.
            </p>
          </div>
        )}

        <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Total de itens: {eapItems?.length ?? 0}
        </div>
      </div>
    </div>
  );
}
