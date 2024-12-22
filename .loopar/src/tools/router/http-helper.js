const stripPrefix = (route) => {
  if (route.startsWith('desk')) route = route.substr(5);
  if (["/", "#", "!"].includes(route.substr(0, 1) === '/')) route = route.substr(1);

  return route;
}

const getSubPathString = (route) => {
  if (!route) {
    route = global.location.hash || (global.location.pathname + global.location.search);
  }
  return stripPrefix(route);
}

const decodeComponent = (r) => {
  try {
    return decodeURIComponent(r);
  } catch (e) {
    if (e instanceof URIError) {
      // legacy: not sure why URIError is ignored.
      return r;
    } else {
      throw e;
    }
  }
}

const getSubPath = (route) => {
  return getSubPathString(route).split('/').map(c => decodeComponent(c));
}

export { getSubPathString, stripPrefix, decodeComponent, getSubPath };