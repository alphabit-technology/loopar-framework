export default class ServerManager {
  constructor(req, res) {
    this._req = req;
    this._res = res;
  }

  get(name) {
    const value = this._req.cookies[name];

    if (value === 'undefined') {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  }

  getAll() {
    return this._req.cookies;
  }

  set(name, value, days = 30) {
    const maxAge = days * 24 * 60 * 60 * 1000;

    this._res.cookie(name, value, { maxAge });
  }
}