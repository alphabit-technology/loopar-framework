//mport { fetchMessage } from './lib.js';
//import { Message } from './message.js';
import { Suspense, use } from 'react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';


const fetchMessage = (icon) => {
  return new Promise((resolve) => {
    const Icon = dynamicIconImports[icon] ? dynamicIconImports[icon] : dynamicIconImports["a-arrow-up"];
    resolve(Icon);
  });
}

const Message = ({ messagePromise }) => {
  const M = use(messagePromise);

  console.log(["message", M])
  return <M/>
  return <p>{message}</p>;
}

export function BaseIcon({icon, ...props}) {
  const messagePromise = fetchMessage(icon);

  return (
    <Suspense fallback={""}>
      <Message messagePromise={messagePromise} />
    </Suspense>
  );
}