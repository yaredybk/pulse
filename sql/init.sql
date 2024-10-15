--  PULSE --
-- BY Yared b. --
-- https://github.com/yaredybk
-- NOTE --- NO FOREIGN KEY IMPLEMENTED

-- initialize database
-- Create a new database called 'main'


-- update updated_at column in a table
CREATE OR REPLACE FUNCTION change_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
-- USERS TABLE
DROP TABLE IF EXISTS chat_private;
DROP TABLE IF EXISTS contact_global;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  iduser SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name TEXT NOT null,
  gender CHAR(1) CHECK (gender IN ('M', 'F')) NULL, 
  birth DATE NULL,
  country TEXT NULL,
  city TEXT NULL,
  phone VARCHAR(20) UNIQUE NULL,
  email TEXT UNIQUE NULL,
  uname TEXT UNIQUE NULL,
  idpass bigint NULL,
  bio TEXT NULL,
  profile TEXT NULL,
  active SMALLINT NULL,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  info jsonb null default '{}'::jsonb
);
create trigger change_users_updated_at before
update on users for each row
execute function change_updated_at_column ();

-- password
DROP TABLE IF EXISTS passwords;
CREATE TABLE passwords (
  idpass SERIAL PRIMARY KEY,
  pass TEXT NOT NULL,
  updated_at timestamp with time zone not null default now()
);
create trigger change_passwords_updated_at before
update on passwords for each row
execute function change_updated_at_column ();

DROP TABLE IF EXISTS chats;
CREATE TABLE chats (
  idchat SERIAL PRIMARY KEY,
  iduser1 BIGINT NOT NULL,
  iduser2 BIGINT NULL,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger change_chat_updated_at before
update on chats for each row
execute function change_updated_at_column ();

DROP TABLE IF EXISTS chat_text;
CREATE TABLE chat_text (
  idchat_text SERIAL PRIMARY KEY,
  idchat BIGINT NOT NULL,
  content TEXT NOT NULL,
  sender BIGINT NOT NULL,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger change_chat_text_updated_at before
update on chat_text for each row
execute function change_updated_at_column ();

DROP TABLE IF EXISTS room;
CREATE TABLE room (
  idroom SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rname TEXT UNIQUE NOT NULL,
  admin BIGINT NOT NULL,
  bio TEXT NULL,
  profile TEXT NULL,
  active SMALLINT NULL,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger change_room_updated_at before
update on room for each row
execute function change_updated_at_column ();

DROP TABLE IF EXISTS members;
CREATE TABLE members (
  idroom BIGINT NOT NULL,
  iduser BIGINT NOT NULL,
  created_at timestamp with time zone not null default now()
);

DROP TABLE IF EXISTS room_text;
CREATE TABLE room_text (
  idroom_text SERIAL PRIMARY KEY,
  idroom BIGINT NOT NULL,
  content TEXT NOT NULL,
  sender BIGINT NOT NULL,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger change_room_text_updated_at before
update on room_text for each row
execute function change_updated_at_column ();
