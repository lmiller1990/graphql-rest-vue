## GraphQL

POST /graphql

```gql
{
  projects {
    categories {
      id
      name
    }
    tasks: {
      id
      name
      category {
        id
        name
      }
    }
  }
}
```

```json
{
  "projects": [
    "categories": [
      {
        "id": 1,
        "name": "Cat 1"
      }
    ],
    "tasks": [
      {
        "id": 1,
        "name": "Task 1",
        "category": {
          "id": 1,
          "name": "Cat 1"
        }
      }
    ]
  ]
}
```
