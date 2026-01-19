# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 + Supabase project for bid management in the construction industry. The application handles proposal comparison and equalization (bid leveling) for construction projects.

**Language and Locale:**
- Project language: Portuguese (Brazilian)
- Currency: Real (BRL)
- App locale: pt-BR (see app/layout.tsx:27)

## Development Commands

```bash
# Start development server (default: http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Architecture

The database schema is defined in `lib/supabase/_schema.md`. The data model follows this structure:

1. **obras** - Construction projects (current project: "Tatiana Albuquerque")
2. **construtoras** - Construction companies submitting proposals (CMN, Laer, Habitte, Stewart)
3. **propostas** - Submitted proposals by construction companies for projects
4. **eap_proposta** - WBS (Work Breakdown Structure) for each proposal
   - `section_*` fields: Top-level WBS items
   - `item_*` fields: Line items with quantities, costs, and pricing details
   - `tag` field: Item classification (cortesia, estimativa, opcional, etc.)
   - `hidden_from_equalization` field: Boolean to exclude items from equalization views
5. **eap_padrao** - Standard WBS reference for bid leveling (4 levels deep)
   - Uses PostgreSQL `ltree` type for hierarchical path storage
   - `caminho` field stores the tree path (e.g., "1.2.3.4")
   - `nivel` is auto-generated from path depth
   - `caminho_sort` provides integer array for proper sorting
6. **eap_equalizacao** - Equalization table linking proposal items to standard WBS
   - Links `eap_proposta` items to `eap_padrao` items

**Key Database Features:**
- Uses `ltree` extension for hierarchical WBS data
- Includes GiST and B-tree indexes on `caminho` for efficient tree queries
- Foreign key cascades for data integrity
- Generated columns for automatic level calculation and sorting

## Supabase Integration

Supabase is configured with separate client implementations for different rendering contexts:

- **Browser Client** (`lib/supabase/client.ts`): For Client Components
- **Server Client** (`lib/supabase/server.ts`): For Server Components and API routes
- **Middleware Client** (`lib/supabase/proxy.ts`): For session refresh in middleware

**Important:** Supabase has a default row limit of 1000. For large queries (like `eap_equalizacao`), use `.limit(10000)`. The project's Supabase settings have been updated to allow 10000 rows per request.

**Environment Variables:**
All necessary Supabase environment variables are set in `.env` (not checked into git):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Application Structure

### Pages

```
app/
├── layout.tsx              # Root layout with Nav component
├── page.tsx                # Landing page with quick links
├── components/
│   ├── Nav.tsx             # Navigation header (client component)
│   └── Sheet.tsx           # Reusable slide-in panel component
├── propostas/
│   ├── page.tsx            # List of received proposals
│   └── [id]/
│       ├── page.tsx        # Proposal detail with items by section
│       └── PropostaItemsTable.tsx  # TanStack Table with tag/hidden controls
├── eap-padrao/
│   └── page.tsx            # Reference WBS tree view
└── equalizacao/
    ├── page.tsx            # Bid leveling main view
    ├── types.ts            # Shared TypeScript interfaces
    ├── EqualizacaoTable.tsx # TanStack Table with tree expansion
    └── [id]/
        ├── page.tsx        # WBS item detail comparison (fetches level 1 WBS)
        ├── ItemsTable.tsx  # Condensed items table with detail sheet
        └── ItemSheet.tsx   # Item detail slide-in panel
```

### Navigation

- `/` - Landing page
- `/propostas` - Proposals list with "Ver proposta" links
- `/propostas/[id]` - Proposal items grouped by section
- `/eap-padrao` - Reference WBS hierarchy
- `/equalizacao` - Bid leveling comparison (main feature)
- `/equalizacao/[id]` - Detail view for specific WBS item

## TanStack Table Usage

The project uses TanStack Table v8 for complex data display. Key patterns:

### Tree/Hierarchical Data (`EqualizacaoTable.tsx`)
```typescript
const table = useReactTable({
  data,
  columns,
  state: { expanded },
  onExpandedChange: setExpanded,
  getSubRows: (row) => row.children,  // Define tree structure
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
});
```

### Expandable Row Details (`ItemsTable.tsx`)
```typescript
const table = useReactTable({
  data: items,
  columns,
  state: { expanded },
  onExpandedChange: setExpanded,
  getRowCanExpand: () => true,  // All rows expandable
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
});

// Render with Fragment for expanded content
{table.getRowModel().rows.map((row) => (
  <Fragment key={row.id}>
    <tr>...</tr>
    {row.getIsExpanded() && <tr>/* expanded content */</tr>}
  </Fragment>
))}
```

### Dynamic Columns
Columns are created dynamically based on data (e.g., one column per proposal):
```typescript
const columns = useMemo(() => {
  const cols = [/* static columns */];
  propostas.forEach((proposta) => {
    cols.push(columnHelper.display({ id: `proposta-${proposta.id}`, ... }));
  });
  return cols;
}, [propostas]);
```

## UI Patterns

### Color Coding for Comparison
- 🟢 Emerald (`bg-emerald-500`) - Lowest value (best price)
- 🟡 Amber (`bg-amber-500`) - Intermediate value
- 🔴 Rose (`bg-rose-500`) - Highest value

### Typography
- **Font family**: Inter (sans-serif) + JetBrains Mono (monospace)
- **Table headers**: `text-[11px] font-semibold uppercase tracking-wide`
- **Table cells**: `text-[13px]`
- **Currency/numbers**: `font-mono text-[13px]`
- **Page titles**: `text-[20px]` to `text-[28px]`
- **Navigation**: `text-[13px]` to `text-[15px]`

### Condensed Table Design
- Monospace font (`font-mono`) for currency alignment
- Truncated text with `title` attribute for hover tooltip
- Minimal padding: `px-2 py-1.5` or `px-3 py-2.5`

### Tree Indentation
```typescript
style={{ paddingLeft: `${depth * 20}px` }}
```

### Sheet Component (`components/Sheet.tsx`)
Reusable slide-in panel from the right side:
```typescript
<Sheet isOpen={isOpen} onClose={onClose} title="Title">
  {children}
</Sheet>
```
Features:
- Backdrop with click-to-close
- Escape key to close
- Body scroll lock when open
- Dark mode support

### Hover-to-Show Actions
Pattern for showing action buttons only on row hover:
```typescript
const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

// In column definition
columnHelper.display({
  id: "actions",
  cell: ({ row }) => (
    <div className={`transition-opacity ${hoveredRowId === row.id ? "opacity-100" : "opacity-0"}`}>
      <button onClick={() => handleAction(row.original)}>...</button>
    </div>
  ),
});

// In row render
<tr onMouseEnter={() => setHoveredRowId(row.id)} onMouseLeave={() => setHoveredRowId(null)}>
```

### Item Detail Sheets
Two sheet components for displaying item details:
- `ItemDetailSheet` (inside `ItemsTable.tsx`): Full item detail with WBS reference dropdown for linking items
- `ItemSheet.tsx`: Simplified item detail view showing description, quantities, and pricing

Both display:
- Description, quantity, and unit
- Unit prices (material/labor)
- Total prices with subtotal

### Item Tagging System
Items in `eap_proposta` can be tagged for classification. Tags are managed in `propostas/[id]` and displayed as badges in equalization views.

**Available tags:**
- `cortesia` - Purple badge
- `estimativa`, `estimativa + pendência` - Blue badge
- `não cotado + sob demanda`, `não cotado + pendência` - Orange badge
- `opcional`, `opcional + revisar escopo` - Gray badge
- `revisar escopo` - Yellow badge
- `condicional` - Cyan badge

**Tag type definition** (`equalizacao/types.ts`):
```typescript
export type EapPropostaTag =
  | "cortesia" | "estimativa" | "estimativa + pendência"
  | "não cotado + sob demanda" | "não cotado + pendência"
  | "opcional" | "opcional + revisar escopo"
  | "revisar escopo" | "condicional";
```

### Hiding Items from Equalization
Items can be marked as hidden from equalization (e.g., note lines, WBS summaries) via checkbox in `propostas/[id]`. Hidden items are filtered out in both `/equalizacao` and `/equalizacao/[id]` pages.

Pattern for optimistic updates:
```typescript
const handleHiddenChange = async (itemId: string, hidden: boolean) => {
  // Optimistic update
  setSections((prev) => prev.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.id === itemId ? { ...item, hidden_from_equalization: hidden } : item
    ),
  })));

  const { error } = await supabase
    .from("eap_proposta")
    .update({ hidden_from_equalization: hidden })
    .eq("id", itemId);

  if (error) setSections(initialSections); // Revert on error
};
```

## TypeScript Configuration

- Path alias `@/*` maps to project root (e.g., `@/lib/supabase/client`)
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler

## Important Notes

- **RLS Disabled** - Row Level Security is currently disabled on Supabase tables for development
- **Tailwind v4** - Configured via PostCSS (no separate tailwind.config file)
- **Server Components by default** - Only use Client Components ("use client") when needed for interactivity
- **No middleware.ts yet** - If implementing auth, create `middleware.ts` at root and use `lib/supabase/proxy.ts`
