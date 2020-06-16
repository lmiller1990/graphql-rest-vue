## Rest API

GET /projects/

```json
[
  {
    "id": 1,
    "name": "Test Project"
  }
]
```

GET /projects/1/categories

```json
[
  {
    "id": 1,
    "name": "ready to develop"
  }
]
```

GET /projects/1/tasks

```json
[
  {
    "id": 1,
    "name": "Test Project",
    "category_id": 1
  }
]
```
