import { db } from "@/drizzle";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/drizzle/schema";
import { UserRole } from "@/enum/user";
import { OperationalError } from "@/action/actionResponse";
import { SelectUserProfile } from "@/drizzle/schema/userProfile";

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
});

type BetterAuthSession = typeof auth.$Infer.Session;

export type SelectUserProfileWithRelations = SelectUserProfile & {
    perangkatDaerah:
    | (SelectPera & {
        induk: SelectPerangkatDaerah | null;
    })
    | null;
};
export type SessionUser = BetterAuthSession["user"] & {
    profile: SelectUser | null;
    roles: RoleUser[];
};

export async function authorizeUser(
    reqHeaders: Headers,
    rolesToVerify: UserRole[] = []
): Promise<SessionUser | null> {
    const authSession = await auth.api.getSession({ headers: reqHeaders });
    if (!authSession?.user) {
        throw new OperationalError(
            "Anda belum login atau sesi Anda sudah berakhir. Silakan masuk kembali."
        );
    }

    const userId = authSession.user.id;
    const [profile, userRolesEntries] = await Promise.all([
        userProfileRepository.findByUserId(db, userId),
        db.query.userRole.findMany({
            where: (ur, { eq }) => eq(ur.userId, userId),
        })
    ]);

    const userRoles = userRolesEntries.map(r => r.role as UserRole);

    if (rolesToVerify.length > 0) {
        const hasAccess = userRoles.some(role => rolesToVerify.includes(role));
        if (!hasAccess) throw new OperationalError(`Anda tidak memiliki akses. Role dibutuhkan: ${rolesToVerify.join(", ")}. Role Anda: ${userRoles.join(", ")}`);
    }

    return {
        ...authSession.user,
        profile: profile ?? null,
        roles: userRoles,
    };
} 