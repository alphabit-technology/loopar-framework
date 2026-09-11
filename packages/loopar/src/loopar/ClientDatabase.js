export class ClientDatabase{
  constructor(loopar){
    this.loopar = loopar
  }

  async getList(document, options = {}){
    return await this.loopar.call("Db", "getList", { query: { document }, body: { options } })
  }

  async getAll(document, options = {}){
    return await this.loopar.call("Db", "getAll", { query: { document }, body: { options: { ...options, all: true } } })
  }

  async getDoc(document, name, data = null, options = {}){
    return await this.loopar.call("Db", "getDoc", { query: { document, name }, body: { data, options } })
  }

  /** Always resolves to a number (the server wraps it as `{ count }`). */
  async count(document, options = {}){
    const r = await this.loopar.call("Db", "count", { query: { document }, body: options })
    if (typeof r === "number") return r
    return Number(r?.count ?? 0) || 0
  }
}