import { redirect } from "next/navigation";
import DashboardClientLayout from "./dashboardClientLayout"; import { headers } from "next/headers";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { actionGetUserWithDetail } from "@/action/user/user/user.action";
import { Alert } from "@heroui/react";
import { UserWithRole } from "better-auth/plugins";

export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    const hd = await headers();
    const pathname = hd.get("x-pathname") ?? "/";
    const res = await actionGetUserWithDetail();
    if (!res.success || !res.data) {
        return redirect(`/auth?last-url=${encodeURIComponent(pathname)}`);
    }

    try {
        return (
            <DashboardClientLayout user={res.data as UserWithRole}>
                {children}
            </DashboardClientLayout>
        );

    } catch (error: any) {
        // WAJIB: Biarkan Next.js menangani error redirect
        if (isRedirectError(error)) throw error;

        console.error("[DashboardLayout Error]", error);

        return (
            <div className="p-6">
                <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Terjadi Kesalahan Sistem</Alert.Title>
                        <Alert.Description>Gagal memuat data dashboard. Silakan coba muat ulang halaman atau hubungi admin.</Alert.Description>
                    </Alert.Content>
                </Alert>
            </div>
        );
    }
}