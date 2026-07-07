"use client"

import { Button } from "@heroui/react"
import { authClient } from "@/lib/auth-client"

export default function Auth() {
    const signIn = async () => {
        const data = await authClient.signIn.social({
            provider: "google",
        });
    };
    return (
        <div>
            <Button onClick={signIn}>Login with Google</Button>
        </div>
    )
}