import { persistentAtom } from "@nanostores/persistent";
import { UserWithRole } from "better-auth/plugins";

export const $user = persistentAtom<UserWithRole | null>(
    "active-user",
    null,
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);
export function setUser(user: UserWithRole | null) {
    $user.set(user);
}

export function clearUser() {
    $user.set(null);
}