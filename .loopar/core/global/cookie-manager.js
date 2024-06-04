//import Cookies from 'universal-cookie';
//const cookies = new Cookies(null, { path: '/' });
import Cookies from 'js-cookie';

export const set = (name, value, options = {}) => {
  Cookies.set(name, value, options);
};

export const get = (name, ootions = {}) => { 
  
  const value = Cookies.get(name, ootions);

  if(value === 'undefined') {
    return undefined;
  }

  if(value === 'true') {
    return true;
  }

  if(value === 'false') {
    return false;
  }

  return value;
};

export const remove = (name, options = {}) => {
  Cookies.remove(name, options);
};

const CookieManager = {
  set,
  get,
  remove
};

export default CookieManager;