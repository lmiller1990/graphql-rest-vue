create table projects (
  id serial primary key,
  name text not null
);

create table categories (
  id serial primary key,
  name text not null
);

create table tasks (
  id serial primary key,
  name text not null,
  project_id integer not null,
  category_id integer not null,
  foreign key (project_id) references projects(id),
  foreign key (category_id) references categories(id)
);
