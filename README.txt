
SUPABASE REQUIREMENTS:

1) Storage bucket:
   Name: fanart
   Public: Enabled

2) Database tables (SQL):
---------------------------------
create table fanart_meta (
  id bigint generated always as identity primary key,
  filename text unique,
  user text,
  likes integer default 0,
  created_at timestamp default now()
);

create table fanart_comments (
  id bigint generated always as identity primary key,
  filename text,
  user text,
  content text,
  created_at timestamp default now()
);

3) RPC to increment likes:
---------------------------------
create or replace function increment_like(f_filename text)
returns void as $$
  update fanart_meta set likes = likes + 1 where filename = f_filename;
$$ language sql security definer;
