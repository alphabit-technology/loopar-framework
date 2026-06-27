import PageContext from './context/page-context.jsx';

// Instances the host owns and independently-built apps must reuse (same module
// identity → React/Context singletons hold). App chunks read from this global
// via shim modules emitted by bin/build-app.js.
const shared = (globalThis.__loopar_shared__ ||= {});
shared['@context/page-context'] = PageContext;

export default shared;
