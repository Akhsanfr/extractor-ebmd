import { db } from "@/drizzle";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/drizzle/schema";
import { admin as adminPlugin } from "better-auth/plugins"
import { ac, roleDefinitions } from "./permissions"
import { OperationalError } from "@/action/actionResponse";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...schema,
            user: schema.userTable,
            session: schema.sessionTable,
            account: schema.accountTable,
            verification: schema.verificationTable,
        },
    }),
    baseURL: process.env.BETTER_AUTH_URL,
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        adminPlugin({
            ac,
            roles: roleDefinitions
        }),

    ]
});
export type AuthSession = typeof auth.$Infer.Session

export const verifyPermissions = async (userId: string, permissions: { [key: string]: string[] }) => {
    const data = await auth.api.userHasPermission({
        body: {
            userId,
            permissions
        },
    });
    if (data.error) throw new OperationalError("Maaf, terjadi kesalahan internal saat pengecekan akses.");
    if (!data.success) throw new OperationalError("Maaf, kamu tidak memiliki hak akses.");
}