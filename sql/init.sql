--  PULSE --
-- BY Yared b. --
-- https://github.com/yaredybk
-- NOTE --- NO FOREIGN KEY IMPLEMENTED

-- initialize database
-- Create a new database called 'main'
CREATE DATABASE main;

-- update updated column in a table
CREATE OR REPLACE FUNCTION change_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
-- USERS TABLE
CREATE TABLE users (
  iduser SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name TEXT NOT null,
  gender CHAR(1) CHECK (gender IN ('M', 'F')) NULL, 
  birth DATE NULL,
  country TEXT NULL,
  city TEXT NULL,
  phone VARCHAR(20) UNIQUE NULL,
  email TEXT NULL,
  uname TEXT UNIQUE NOT NULL,
  idpass bigint NULL,
  bio TEXT NULL,
  profile TEXT NULL,
  active SMALLINT NULL,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now()
);
create trigger change_users_updated_at before
update on users for each row
execute function change_updated_at_column ();

-- password
CREATE TABLE passwords (
  idpass SERIAL PRIMARY KEY,
  pass TEXT NOT NULL,
  updated timestamp with time zone not null default now()
);
create trigger change_password_updated_at before
update on password for each row
execute function change_updated_at_column ();

CREATE TABLE chats (
  idchat SERIAL PRIMARY KEY,
  u1 BIGINT NOT NULL,
  u2 BIGINT NULL,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now()
);
create trigger change_chat_updated_at before
update on chats for each row
execute function change_updated_at_column ();

CREATE TABLE chat_text (
  idchat_text SERIAL PRIMARY KEY,
  idchat BIGINT NOT NULL,
  content TEXT NOT NULL,
  sender BIGINT NOT NULL,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now()
);
create trigger change_chat_text_updated_at before
update on chat_text for each row
execute function change_updated_at_column ();

CREATE TABLE room (
  idroom SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rname TEXT UNIQUE NOT NULL,
  admin BIGINT NOT NULL,
  bio TEXT NULL,
  profile TEXT NULL,
  active SMALLINT NULL,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now()
);
create trigger change_room_updated_at before
update on room for each row
execute function change_updated_at_column ();

CREATE TABLE members (
  idroom BIGINT NOT NULL,
  iduser BIGINT NOT NULL,
  created timestamp with time zone not null default now()
);

CREATE TABLE room_text (
  idroom_text SERIAL PRIMARY KEY,
  idroom BIGINT NOT NULL,
  content TEXT NOT NULL,
  sender BIGINT NOT NULL,
  created timestamp with time zone not null default now(),
  updated timestamp with time zone not null default now()
);
create trigger change_room_text_updated_at before
update on room_text for each row
execute function change_updated_at_column ();
