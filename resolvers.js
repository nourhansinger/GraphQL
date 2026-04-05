import { GraphQLError } from "graphql/error/GraphQLError.js"
import userModel from "./models/users.js"
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs"
import todoModel from "./models/todos.js"

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
            const users = await userModel.find()
            return users
        },

        user: async (_, { id }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== id) {
                throw new GraphQLError("Not authorized to view this user", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            const user = await userModel.findById(id)

            if (!user) {
                throw new GraphQLError("User not found", {
                    extensions: { code: 'NOT_FOUND' }
                })
            }

            return user
        },

        todos: async (_, __, context) => {
            checkAdmin(context)
            return await todoModel.find()
        },

        todo: async (_, { id }, context) => {
            checkAuth(context)

            const todo = await todoModel.findById(id)

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

            const todos = await todoModel.find({ userId })

            return todos
        },
    },

    Mutation: {
        register: async (_, args) => {
            const hashedPassword = await bcrypt.hash(args.user.password, 10)

            const user = await userModel.create({
                ...args.user,
                password: hashedPassword
            })

            return user
        },

        login: async (_, { user }) => {
            let { email, password } = user

            if (!email || !password) {
                throw new GraphQLError('You must provide email and password', {
                    extensions: { code: 'BAD_USER_INPUT' }
                })
            }

            const foundedUser = await userModel.findOne({ email })

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

            const newTodo = await todoModel.create({
                ...todo,
                userId: context.id
            })

            return newTodo
        },

        updateTodo: async (_, { id, todo }, context) => {
            checkAuth(context)

            const existingTodo = await todoModel.findById(id)

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

            const updatedTodo = await todoModel.findByIdAndUpdate(id, todo, { new: true })

            return updatedTodo
        },

        deleteTodo: async (_, { id }, context) => {
            checkAuth(context)

            const todo = await todoModel.findById(id)

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

            await todoModel.findByIdAndDelete(id)

            return "Todo deleted successfully"
        },

        updateUser: async (_, { id, user }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== id) {
                throw new GraphQLError("You can only update your own account", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            const updatedUser = await userModel.findByIdAndUpdate(id, user, { new: true })

            return updatedUser
        },

        deleteUser: async (_, { id }, context) => {
            checkAuth(context)

            if (context.role !== 'admin' && context.id !== id) {
                throw new GraphQLError("You can only delete your own account", {
                    extensions: { code: 'FORBIDDEN' }
                })
            }

            await userModel.findByIdAndDelete(id)

            return "User deleted successfully"
        }
    },

    User: {
        todos: async (parent) => {
            const todos = await todoModel.find({ userId: parent._id })
            return todos
        }
    },

    Todo: {
        user: async (parent) => {
            const user = await userModel.findOne({ _id: parent.userId })
            return user
        }
    }
}