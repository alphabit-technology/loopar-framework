export default class ClientManager {
  constructor(props) {
    this.updater = props.updater;
  }

  get(name) {
    const cookies = this.getAll();

    const value = cookies[name];

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
    const pairs = document.cookie.split(';');
    const cookies = {};

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split('=');
      cookies[(pair[0] + '').trim()] = decodeURIComponent(pair[1]);
    }

    return cookies;
  }

  set(name, value = '', days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

    const chunks = [
      `${name}=${value}`,
      `expires=${date.toUTCString()}`,
      'path=/'
    ].join('; ');

    document.cookie = chunks;
    this.updater && this.updater(date);
  }
}