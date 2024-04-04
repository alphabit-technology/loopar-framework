import Cookies from 'universal-cookie';
const cookies = new Cookies(null, { path: '/' });

export const set = (name, value, options={}) => {
    cookies.set(name, value, options);
};

export const get = (name, ootions={}) => {
    return cookies.get(name, ootions);
};

export const remove = (name, options={}) => {
    cookies.remove(name, options);
};

const CookieManager = {
    set,
    get,
    remove
};

export default CookieManager;