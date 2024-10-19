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

-- add the creator of a room to its members
-- and add "room created message"
CREATE OR REPLACE FUNCTION add_admin_to_members()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO members (idroom, iduser) VALUES (NEW.idroom, NEW.admin);
	INSERT INTO room_text (idroom,sender,content) 
		VALUES (NEW.idroom, NEW.admin, concat('room created at: ', now()));
  RETURN NEW;
END;
$$ language 'plpgsql';

-- USERS TABLE
DROP VIEW IF EXISTS chat_private;
DROP VIEW IF EXISTS contact_global;	
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
  count bigint DEFAULT 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger change_chat_updated_at before
update on chats for each row
execute function change_updated_at_column ();

-- increment count column on insert
CREATE OR REPLACE FUNCTION increment_count_column()
RETURNS TRIGGER AS $$
BEGIN
  OLD.count := COALESCE(OLD.count, 0) + 1;
  RETURN NEW;
END;
$$ language 'plpgsql';

create trigger increment_chat_count_column BEFORE
insert on chats for each row
execute function increment_count_column ();

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



DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
  idroom SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  name TEXT NOT NULL,
  admin BIGINT NOT NULL,
  rname TEXT UNIQUE NULL,
  bio TEXT NULL,
  profile TEXT NULL,
  active SMALLINT NULL,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create trigger change_room_updated_at before
update on rooms for each row
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

create trigger add_admin_to_members after
insert on rooms for each row
execute function add_admin_to_members ();


DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles (
    uuid UUID NOT NULL,
    type TEXT NOT NULL,
    delete_url TEXT NULL,
    display_url TEXT NOT NULL,
    thumb_url TEXT NULL,
    created_at timestamp with time zone not null default now()
);


