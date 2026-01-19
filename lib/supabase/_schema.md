Supabase DB schema:

```sql
create table public.construtoras (
  id uuid not null default gen_random_uuid (),
  nome text not null,
  created_at timestamp with time zone null default now(),
  constraint construtoras_pkey primary key (id)
) TABLESPACE pg_default;
```

```sql
create table public.eap_equalizacao (
  id uuid not null default gen_random_uuid (),
  eap_proposta_id uuid not null,
  eap_padrao_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint eap_equalizacao_pkey primary key (id),
  constraint eap_equalizacao_eap_proposta_id_eap_padrao_id_key unique (eap_proposta_id, eap_padrao_id),
  constraint eap_equalizacao_eap_padrao_id_fkey foreign KEY (eap_padrao_id) references eap_padrao (id) on delete CASCADE,
  constraint eap_equalizacao_eap_proposta_id_fkey foreign KEY (eap_proposta_id) references eap_proposta (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_eap_equalizacao_proposta on public.eap_equalizacao using btree (eap_proposta_id) TABLESPACE pg_default;

create index IF not exists idx_eap_equalizacao_padrao on public.eap_equalizacao using btree (eap_padrao_id) TABLESPACE pg_default;
```

```sql
create table public.eap_padrao (
  id uuid not null default extensions.uuid_generate_v4 (),
  caminho public.ltree not null,
  item text not null,
  nivel integer GENERATED ALWAYS as (nlevel (caminho)) STORED null,
  parent_id uuid null,
  created_at timestamp with time zone null default now(),
  caminho_sort ARRAY GENERATED ALWAYS as (
    (string_to_array((caminho)::text, '.'::text))::integer[]
  ) STORED null,
  constraint eap_padrao_pkey1 primary key (id),
  constraint eap_caminho_unique unique (caminho),
  constraint eap_padrao_parent_id_fkey foreign KEY (parent_id) references eap_padrao (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_eap_caminho_gist on public.eap_padrao using gist (caminho) TABLESPACE pg_default;

create index IF not exists idx_eap_caminho_btree on public.eap_padrao using btree (caminho) TABLESPACE pg_default;

create index IF not exists idx_eap_sort on public.eap_padrao using btree (caminho_sort) TABLESPACE pg_default;
```

```sql
create table public.eap_proposta (
  id uuid not null default gen_random_uuid (),
  proposta_id uuid not null,
  section_id integer not null,
  section_name text not null,
  section_total numeric(15, 2) null,
  item_number text null,
  item_code text null,
  item_description text null,
  item_quantity numeric(15, 4) null,
  item_unit text null,
  item_unit_price_material numeric(15, 2) null default 0,
  item_unit_price_labor numeric(15, 2) null default 0,
  item_total_price_material numeric(15, 2) null default 0,
  item_total_price_labor numeric(15, 2) null default 0,
  item_total_price_subtotal numeric(15, 2) null default 0,
  item_status text null,
  created_at timestamp with time zone null default now(),
  item_order integer null,
  item_unit_total_price_subtotal numeric(15, 2) null default 0,
  tag text null check (tag in (
    'cortesia',
    'estimativa',
    'estimativa + pendência',
    'não cotado + sob demanda',
    'não cotado + pendência',
    'opcional',
    'opcional + revisar escopo',
    'revisar escopo',
    'condicional'
  )),
  hidden_from_equalization boolean not null default false,
  constraint eap_proposta_pkey primary key (id),
  constraint eap_proposta_proposta_id_fkey foreign KEY (proposta_id) references propostas (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_eap_proposta_proposta_id on public.eap_proposta using btree (proposta_id) TABLESPACE pg_default;
```

```sql
create table public.obras (
  id uuid not null default gen_random_uuid (),
  nome text not null,
  created_at timestamp with time zone null default now(),
  constraint obras_pkey primary key (id)
) TABLESPACE pg_default;
```

```sql
create table public.propostas (
  id uuid not null default gen_random_uuid (),
  obra_id uuid not null,
  construtora_id uuid not null,
  data_referencia date not null,
  status text not null default 'pendente'::text,
  valor_total numeric(15, 2) not null,
  arquivo_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint propostas_pkey primary key (id),
  constraint propostas_construtora_id_fkey foreign KEY (construtora_id) references construtoras (id) on delete CASCADE,
  constraint propostas_obra_id_fkey foreign KEY (obra_id) references obras (id) on delete CASCADE
) TABLESPACE pg_default;
```
