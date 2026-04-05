# DataSource in GraphQL (Apollo Server)

What is DataSource?

DataSource is a class that Apollo Server uses to connect to a specific data source (database, REST API, etc.).  
It helps you organize your data fetching logic in one place instead of writing it directly in resolvers.


Benefits:

- Clean code — data logic is separated from resolver logic
- Caching — DataSource can cache results to avoid repeated database calls
- Reusable — the same DataSource can be used in many resolvers

---

Simple Example with MongoDB

Step 1: Create a DataSource class

```js
// dataSources/todoDataSource.js

class TodoDataSource {
    constructor(todoModel) {
        this.model = todoModel
    }

    async getAll() {
        return await this.model.find()
    }

    async getById(id) {
        return await this.model.findById(id)
    }

    async getByUser(userId) {
        return await this.model.find({ userId })
    }

    async create(data) {
        return await this.model.create(data)
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { new: true })
    }

    async delete(id) {
        await this.model.findByIdAndDelete(id)
        return "Todo deleted successfully"
    }
}

export default TodoDataSource
```

Step 2: Add DataSource to the server context

```js

import TodoDataSource from "./dataSources/todoDataSource.js"
import todoModel from "./models/todos.js"

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
})

const info = await startStandaloneServer(server, {
    listen: { port: 3000 },
    context: ({ req }) => {
        return {
            dataSources: {
                todos: new TodoDataSource(todoModel)
            }
        }
    }
})
```

### Step 3: Use DataSource in resolvers

```js

export const resolvers = {
    Query: {
        // BEFORE (without DataSource):
        // todos: async () => {
        //     const todos = await todoModel.find()
        //     return todos
        // }

        // AFTER (with DataSource):
        todos: async (_, __, context) => {
            return await context.dataSources.todos.getAll()
        },
        todo: async (_, { id }, context) => {
            return await context.dataSources.todos.getById(id)
        },
        todosByUser: async (_, { userId }, context) => {
            return await context.dataSources.todos.getByUser(userId)
        }
    },
    Mutation: {
        addTodo: async (_, { todo }, context) => {
            return await context.dataSources.todos.create({
                ...todo,
                userId: context.id
            })
        }
    }
}
```

---

## Summary

| Without DataSource | With DataSource |
|---|---|
| Database logic is inside resolvers | Database logic is in a separate class |
| Hard to reuse | Easy to reuse in any resolver |
| No built-in caching | Can add caching easily |
| Resolvers become long | Resolvers stay short and clean |

> Note: In our project we did NOT use DataSource — we wrote the logic directly in resolvers because it's simpler for learning. But in real/big projects, DataSource is the recommended pattern.
