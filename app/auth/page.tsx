"use client"

import { Button } from "@heroui/react"
import { authClient } from "@/lib/auth/auth-client"

export default function Auth() {
    const signIn = async () => {
        const data = await authClient.signIn.social({
            provider: "google",
        });
    };
    const signInAdmin = async () => {
        const data = await authClient.signIn.email({
            email: "admin@example.com",
            password: "fr112358",
        });
    };
    return (
        <div>
            <Button onClick={signInAdmin}>Login as Admin</Button>
            <Button onClick={signIn}>Login with Google</Button>
        </div>
    )
}