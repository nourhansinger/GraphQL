class UserDataSource {
    constructor(userModel) {
        this.model = userModel
    }

    async getAll() {
        return await this.model.find()
    }

    async getById(id) {
        return await this.model.findById(id)
    }

    async getByEmail(email) {
        return await this.model.findOne({ email })
    }

    async create(data) {
        return await this.model.create(data)
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { new: true })
    }

    async delete(id) {
        await this.model.findByIdAndDelete(id)
        return "User deleted successfully"
    }
}

export default UserDataSource
