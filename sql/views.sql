
drop view if exists chat_private;
-- chats private list
CREATE OR REPLACE VIEW chat_private AS
SELECT 
    c.idchat,
    u1.name AS name1,
    u1.uuid AS uuid1,
    u1.email AS email1,
    u2.name AS name2,
    u2.uuid AS uuid2,
    u2.email AS email2,
    c.created_at,
    c.updated_at
FROM 
    chats c
JOIN 
    users u1 ON c.iduser1 = u1.iduser
LEFT JOIN 
    users u2 ON c.iduser2 = u2.iduser;

-- contact public list
drop view if exists contact_global;
CREATE OR REPLACE VIEW contact_global AS
SELECT 
  iduser,
  uuid,
  name,
  email,
  uname,
  bio,
  profile,
  active
FROM 
    users;
