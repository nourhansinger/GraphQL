export const schema = `#graphql
type Query{
 greeting:String
 users:[User]
 user(id:ID):User
 todos:[Todo]
 todo(id:ID):Todo
 todosByUser(userId:ID!): [Todo]
}

type Mutation{
    register(user:RegisteredUser!):User
    login(user:LoggedInUser!):LoginResponse
    addTodo(todo:AddTodoInput!):Todo
    updateTodo(id:ID!, todo:UpdateTodoInput!):Todo
    deleteTodo(id:ID!):String
    updateUser(id:ID!, user:UpdateUserInput!):User
    deleteUser(id:ID!):String
}


interface IUser{
     email:String
    username:String
}
enum S{
    done
    inprogress
    todo
}
type User implements IUser{
    _id:ID
    email:String
    username:String
    role:String
    todos:[Todo]
}

type Todo{
    _id:ID
    title:String
    status:S
    user:User
}
type LoginResponse{
    message:String
    token:String
}
input RegisteredUser{
 email:String!
 username:String!
 password:String!
 role:String
}
input LoggedInUser{
    email:String!
    password:String!
}
input AddTodoInput{
    title:String!
    status:S
}
input UpdateTodoInput{
    title:String
    status:S
}
input UpdateUserInput{
    email:String
    username:String
    password:String
}
`




//String , Int , Float , ID , Boolean

// _id 54thktmh564th5th


// get  /greeting     "Hello world"
//query greeting      "Hello world"
//users   users

// mutation addUser(user:)  => User

//
//query -=>  get
//mutation  => add , update , delete