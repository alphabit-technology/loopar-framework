export class ClientDatabase{
  constructor(loopar){
    this.loopar = loopar
  }

  async getList(document, options = {}){
    return await this.loopar.api.post("Db", "getList", { query: { document }, body: { options } })
  }

  async getAll(document, options = {}){
    return await this.loopar.api.post("Db", "getAll", { query: { document }, body: { options: { ...options, all: true } } })
  }

  async getDoc(document, name, data = null, options = {}){
    return await this.loopar.api.post("Db", "getDoc", { query: { document, name }, body: { data, options } })
  }

  async count(document, options = {}){
    return await this.loopar.api.post("Db", "count", { query: { document }, body: options })
  }
}