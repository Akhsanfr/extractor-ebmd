import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { adminClient } from "better-auth/client/plugins"

import { ac, roleDefinitions } from "@/lib/auth/permissions";
export const authClient = createAuthClient({
    plugins: [
        adminClient({
            ac,
            roles: roleDefinitions,
        })
    ]
    //you can pass client configuration here
})

