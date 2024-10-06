

-- the ultimate table
create table
  main.ultimate (
    -- ID
    idultimate SERIAL PRIMARY KEY,
    idultimate bigint not null,
    idultimate UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    idultimate UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    -- NUMBERS
    amount integer null default 0,
    status smallint null,
    -- ENUM
    gender CHAR(1) CHECK (gender IN ('M', 'F')) NULL,
    -- JSON
    abc jsonb null default '{}'::jsonb,
    abc jsonb not null default '{}'::jsonb,
    abc jsonb null default '[]'::jsonb,
    -- TIMESTAMP
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    -- TEXT
    url text null,
    req character varying not null default ''::character varying,
    -- CONSTRAINTS
    constraint ultimates1_pkey primary key (idultimate),
    constraint ultimates1_idreport_key unique (idultimate),
    constraint ultimates1_created_by_fkey foreign key (created_by) references auth.users (id) on update cascade,
    constraint ultimates1_updated_by_fkey foreign key (updated_by) references auth.users (id) on update cascade,
    constraint table0_pkey primary key (req),
    constraint table0_uuid_fkey foreign key (uuid) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;

create trigger change_table0_updated_at before
update on table0 for each row
execute function change_updated_at_column ();


-- updated at table
CREATE OR REPLACE FUNCTION change_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
