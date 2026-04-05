import { GraphQLError } from "graphql/error/GraphQLError.js"
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs"

function checkAuth(context) {
    if (!context.id || !context.role) {
        throw new GraphQLError('You must be logged in', {
            extensions: { code: 'UNAUTHENTICATED' }
        })
    }
}

function checkAdmin(context) {
    checkAuth(context)
    if (context.role !== 'admin') {
        throw new GraphQLError('Admin access only', {
            extensions: { code: 'FORBIDDEN' }
        })
    }
}

export const resolvers = {
    Query: {
        greeting: () => {
            return "Hello world"
        },

        users: async (_, __, context) => {
            checkAdmin(context)
            const users = await context.dataSources.users.getAll()
            return users
        },

        user: async (_, { id }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== id) {
                throw new GraphQLError("Not authorized to view this user", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            const user = await context.dataSources.users.getById(id)

            if (!user) {
                throw new GraphQLError("User not found", {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            return user
        },

        todos: async (_, __, context) => {
            checkAdmin(context)
            return await context.dataSources.todos.getAll()
        },

        todo: async (_, { id }, context) => {
            checkAuth(context)

            const todo = await context.dataSources.todos.getById(id)

            if (!todo) {
                throw new GraphQLError('Todo not found', {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            if (context.role !== 'admin' && todo.userId.toString() !== context.id) {
                throw new GraphQLError("You're not allowed to view this todo", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            return todo
        },

        todosByUser: async (_, { userId }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== userId) {
                throw new GraphQLError("You're not allowed to view these todos", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            const todos = await context.dataSources.todos.getByUser(userId)

            return todos
        },
    },

    Mutation: {
        register: async (_, args, context) => {
            if (!args.user.email || !args.user.password) {
                throw new GraphQLError('You must provide email and password', {
                    extensions: { code: 'BAD_USER_INPUT' }
                })
            }
            const hashedPassword = await bcrypt.hash(args.user.password, 10)

            const user = await context.dataSources.users.create({
                ...args.user,
                password: hashedPassword
            })

            return user
        },

        login: async (_, { user }, context) => {
            let { email, password } = user

            if (!email || !password) {
                throw new GraphQLError('You must provide email and password', {
                    extensions: { code: 'BAD_USER_INPUT' }
                })
            }

            const foundedUser = await context.dataSources.users.getByEmail(email)

            if (!foundedUser) {
                throw new GraphQLError('User not found', {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            let isValid = await bcrypt.compare(password, foundedUser.password)

            if (!isValid) {
                throw new GraphQLError('Invalid email or password', {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            let token = jwt.sign(
                { id: foundedUser._id, role: foundedUser.role },
                process.env.SECRET,
                { expiresIn: '1d' }
            )

            return { message: 'Loggedin success', token }
        },

        addTodo: async (_, { todo }, context) => {
            checkAuth(context)

            const newTodo = await context.dataSources.todos.create({
                ...todo,
                userId: context.id
            })

            return newTodo
        },

        updateTodo: async (_, { id, todo }, context) => {
            checkAuth(context)

            const existingTodo = await context.dataSources.todos.getById(id)

            if (!existingTodo) {
                throw new GraphQLError('Todo not found', {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            if (context.role !== 'admin' && existingTodo.userId.toString() !== context.id) {
                throw new GraphQLError("You're not allowed to update this todo", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            const updatedTodo = await context.dataSources.todos.update(id, todo)

            return updatedTodo
        },

        deleteTodo: async (_, { id }, context) => {
            checkAuth(context)

            const todo = await context.dataSources.todos.getById(id)

            if (!todo) {
                throw new GraphQLError('Todo not found', {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            if (context.role !== 'admin' && todo.userId.toString() !== context.id) {
                throw new GraphQLError("You're not allowed to delete this todo", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            return await context.dataSources.todos.delete(id)
        },

        updateUser: async (_, { id, user }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== id) {
                throw new GraphQLError("You can only update your own account", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            const updatedUser = await context.dataSources.users.update(id, user)

            return updatedUser
        },

        deleteUser: async (_, { id }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== id) {
                throw new GraphQLError("You can only delete your own account", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            return await context.dataSources.users.delete(id)
        }
    },

    User: {
        todos: async (parent, _, context) => {
            const todos = await context.dataSources.todos.getByUser(parent._id)
            return todos
        }
    },

    Todo: {
        user: async (parent, _, context) => {
            const user = await context.dataSources.users.getById(parent.userId)
            return user
        }
    }
}
