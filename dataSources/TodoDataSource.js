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
