# `@vocabulary/config`

Typed configuration at deployment boundaries.

```ts
import { parseServerConfig } from "@vocabulary/config/server";

const config = parseServerConfig(process.env);
```

Web and mobile code must import only `@vocabulary/config/client`. The client entry point defines
only explicitly public `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` variables. Server secrets are unavailable
from that entry point.

Validation fails before application startup, identifies invalid variable names, and never includes
their values. Add a variable to the narrowest schema, update `.env.example`, and cover valid,
missing, malformed, and exposure behavior with tests.
