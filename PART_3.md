In the previous two articles, we looked at how to use TypeORM and Express to create a REST API in a modular, testable fashion. This lay the groundwork for our real goal: a GraphQL server.

To build a GraphQL server and get a great TypeScript experience, we need a few libraries.

- [`express-graphql`](https://github.com/graphql/express-graphql) and `graphql`. `graphql` is a **JavaScript** implementation of GraphQL. `express-graphql` just wraps it nicely for us.
- [`type-graphql`](https://github.com/MichalLytek/type-graphql). This will give us some decorators we can use to bridge the gap from GraphQL schema and our ORM (TypeORM in this case).
- [`typedi`](https://github.com/typestack/typedi) and [`typeorm-typedi-extensions`](https://github.com/typeorm/typeorm-typedi-extensions). This will help integrat `type-graphql` and TypeORM better.

I don't normally like to use heaps of libraries, but this is the best combination of libraries I've found to work with GraphQL and TypeScript.
