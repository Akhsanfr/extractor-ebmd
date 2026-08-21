"use client"

import { actionTesAuthoriseUser } from "@/action/tes/tes.action"
import { actionGetUserWithDetail } from "@/action/user/user/user.action";
import { UserContract } from "@/action/user/user/user.contract";
import { authClient } from "@/lib/auth-client";
import { Button, Card, CardContent, toast } from "@heroui/react";
import { useEffect, useState } from "react";

export default function TesPage() {
    async function TesAuthorization() {
        const result = await actionTesAuthoriseUser();
        console.log("result", result)
        if (!result.success) {
            toast.danger(result.error.message)
        }
    }
    const [user, setUser] = useState<UserContract.SelectWithDetail | null>(null);
    const getUserDetail = async () => {
        const result = await actionGetUserWithDetail();
        if (!result.success) {
            toast.danger(result.error.message)
            return
        }
        setUser(result.data);
    }
    const signIn = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/tes",
        });
    };
    const signOut = async () => {
        await authClient.signOut();
        setUser(null);
        getUserDetail()
    }
    useEffect(() => {
        getUserDetail();
    }, [])
    return <div>
        <Button onClick={TesAuthorization}>Tes Authorise User</Button>
        <Button onClick={signIn}>Login</Button>
        <Button onClick={signOut}>Logout</Button>
        {
            user ?
                <Card>
                    <CardContent>
                        <code className="text-xs">
                            {JSON.stringify(user, null, 2)}
                        </code>
                    </CardContent>
                </Card> : <p>User belum login</p>
        }
    </div>

}
