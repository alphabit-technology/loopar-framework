import io from "@pm2/io";

io.metric({
  name: "Port",
  value: () => process.env.PORT
});

io.metric({
  name: "Tenant",
  value: () => process.env.TENANT_ID
});

io.metric({
  name: "HMR",
  value: () => process.env.HMR_PORT
});

import("./start.js");
