begin;

create table projects (
  id serial primary key,
  name text not null
);

create table categories (
  id serial primary key,
  name text not null,
  project_id integer not null
);

alter table categories add foreign key (project_id) references projects(id) on delete cascade;

create table tasks (
  id serial primary key,
  name text not null,
  project_id integer not null,
  category_id integer not null
);

alter table tasks add foreign key (project_id) references projects(id) on delete cascade;
alter table tasks add foreign key (category_id) references categories(id) on delete cascade;

commit;
