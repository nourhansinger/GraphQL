import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { schema } from "./schema.js";
import { resolvers } from "./resolvers.js";
import mongoose from "mongoose";
import { loadEnvFile } from 'node:process'
import jwt from "jsonwebtoken";
import TodoDataSource from "./dataSources/TodoDataSource.js";
import UserDataSource from "./dataSources/UserDataSource.js";
import todoModel from "./models/todos.js";
import userModel from "./models/users.js";



loadEnvFile()

mongoose.connect('mongodb://127.0.0.1:27017/graphqlDB').then(() => {
    console.log('connected to db');
}).catch((err) => {
    console.log(err);

})

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    formatError: (err) => {
        return {
            message: err.message,
            code: err.extensions.code
        }
    }
})

const port = 3000
const info = await startStandaloneServer(server, {
    listen: {
        port
    },
    context: ({ req }) => {
        let auth = {}
        let { authorization } = req.headers
        if (authorization) {
            auth = jwt.verify(authorization, process.env.SECRET)//{id,role}
        }
        return {
            ...auth,
            dataSources: {
                todos: new TodoDataSource(todoModel),
                users: new UserDataSource(userModel)
            }
        }
    }
})
console.log(info);

console.log(`server is ready on ${info.url}`); //localhost:3000
