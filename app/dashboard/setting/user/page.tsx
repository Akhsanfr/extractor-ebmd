"use client";

import { authClient } from "@/lib/auth/auth-client";
import {
    AlertDialog,
    Avatar,
    Button,
    Chip,
    Dropdown,
    EmptyState,
    Input,
    InputGroup,
    Label,
    ListBox,
    Pagination,
    Select,
    Skeleton,
    Table,
    TextField,
    type SortDescriptor,
} from "@heroui/react";
import {
    Ban,
    Check,
    KeyRound,
    LogIn,
    MoreVertical,
    Search,
    ShieldCheck,
    Trash,
    Trash2,
    UserCog,
    Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { UserRole } from "@/enum/user";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminUser = {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: UserRole | null;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: string | Date | null;
    createdAt: string | Date;
};

type QuickFilter =
    | "all"
    | "role-admin"
    | "role-admin-opd"
    | "role-user"
    | "status-active"
    | "status-banned";

type ConfirmAction =
    | { type: "ban"; user: AdminUser }
    | { type: "unban"; user: AdminUser }
    | { type: "delete"; user: AdminUser }
    | { type: "set-password"; user: AdminUser }
    | null;

const ROLE_LABEL: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Admin",
    [UserRole.ADMIN_OPD]: "Admin OPD",
    [UserRole.USER]: "User",
};

const ROLE_CHIP_COLOR: Record<UserRole, "accent" | "warning" | "default"> = {
    [UserRole.ADMIN]: "accent",
    [UserRole.ADMIN_OPD]: "warning",
    [UserRole.USER]: "default",
};

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserManagementTable() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);

    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });

    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [newPassword, setNewPassword] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);

    // Debounce search input -> search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Reset to page 1 when filter/sort changes
    useEffect(() => {
        setPage(1);
    }, [quickFilter, sortDescriptor]);

    const buildFilter = useCallback((): {
        filterField?: string;
        filterValue?: string | boolean;
        filterOperator?: "eq";
    } => {
        switch (quickFilter) {
            case "role-admin":
                return { filterField: "role", filterValue: UserRole.ADMIN, filterOperator: "eq" };
            case "role-admin-opd":
                return { filterField: "role", filterValue: UserRole.ADMIN_OPD, filterOperator: "eq" };
            case "role-user":
                return { filterField: "role", filterValue: UserRole.USER, filterOperator: "eq" };
            case "status-active":
                return { filterField: "banned", filterValue: false, filterOperator: "eq" };
            case "status-banned":
                return { filterField: "banned", filterValue: true, filterOperator: "eq" };
            default:
                return {};
        }
    }, [quickFilter]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setActionError(null);
        try {
            const { filterField, filterValue, filterOperator } = buildFilter();
            const { data, error } = await authClient.admin.listUsers({
                query: {
                    ...(search
                        ? { searchValue: search, searchField: "name", searchOperator: "contains" }
                        : {}),
                    ...(filterField ? { filterField, filterValue, filterOperator } : {}),
                    limit: PAGE_SIZE,
                    offset: (page - 1) * PAGE_SIZE,
                    sortBy: String(sortDescriptor.column),
                    sortDirection: sortDescriptor.direction === "descending" ? "desc" : "asc",
                },
            });

            if (error) {
                setActionError(error.message ?? "Gagal memuat data pengguna");
                return;
            }

            setUsers((data?.users ?? []) as AdminUser[]);
            setTotal(data?.total ?? 0);
        } catch {
            setActionError("Gagal memuat data pengguna");
        } finally {
            setIsLoading(false);
        }
    }, [search, page, sortDescriptor, buildFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // -- Actions -------------------------------------------------------------

    const handleSetRole = async (user: AdminUser, role: UserRole) => {
        if (user.role === role) return;
        setIsMutating(true);
        setActionError(null);
        try {
            // const { error } = await authClient.admin.setRole({ userId: user.id, role : role });
            // if (error) {
            //     setActionError(error.message ?? "Gagal mengubah role");
            //     return;
            // }
            // await fetchUsers();
        } finally {
            setIsMutating(false);
        }
    };

    const handleBan = async (user: AdminUser) => {
        setIsMutating(true);
        setActionError(null);
        try {
            const { error } = await authClient.admin.banUser({
                userId: user.id,
                banReason: "Dinonaktifkan oleh admin",
            });
            if (error) {
                setActionError(error.message ?? "Gagal menonaktifkan pengguna");
                return;
            }
            await fetchUsers();
        } finally {
            setIsMutating(false);
            setConfirmAction(null);
        }
    };

    const handleUnban = async (user: AdminUser) => {
        setIsMutating(true);
        setActionError(null);
        try {
            const { error } = await authClient.admin.unbanUser({ userId: user.id });
            if (error) {
                setActionError(error.message ?? "Gagal mengaktifkan kembali pengguna");
                return;
            }
            await fetchUsers();
        } finally {
            setIsMutating(false);
            setConfirmAction(null);
        }
    };

    const handleDelete = async (user: AdminUser) => {
        setIsMutating(true);
        setActionError(null);
        try {
            const { error } = await authClient.admin.removeUser({ userId: user.id });
            if (error) {
                setActionError(error.message ?? "Gagal menghapus pengguna");
                return;
            }
            await fetchUsers();
        } finally {
            setIsMutating(false);
            setConfirmAction(null);
        }
    };

    const handleSetPassword = async (user: AdminUser) => {
        if (newPassword.length < 8) {
            setActionError("Password minimal 8 karakter");
            return;
        }
        setIsMutating(true);
        setActionError(null);
        try {
            const { error } = await authClient.admin.setUserPassword({
                userId: user.id,
                newPassword,
            });
            if (error) {
                setActionError(error.message ?? "Gagal mengubah password");
                return;
            }
            setNewPassword("");
        } finally {
            setIsMutating(false);
            setConfirmAction(null);
        }
    };

    const handleImpersonate = async (user: AdminUser) => {
        setIsMutating(true);
        setActionError(null);
        try {
            const { error } = await authClient.admin.impersonateUser({ userId: user.id });
            if (error) {
                setActionError(error.message ?? "Gagal impersonate pengguna");
                return;
            }
            window.location.href = "/dashboard";
        } finally {
            setIsMutating(false);
        }
    };

    const initials = (name: string) =>
        name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

    const formatDate = (value: string | Date) =>
        new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Users className="size-5 text-muted" />
                    <h2 className="text-base font-semibold">Manajemen Pengguna</h2>
                    <Chip size="sm">{total} pengguna</Chip>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <InputGroup className="w-full sm:w-64">
                        <InputGroup.Prefix>
                            <Search className="size-4 text-muted" />
                        </InputGroup.Prefix>
                        <Input
                            placeholder="Cari nama atau email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </InputGroup>

                    <Select
                        className="w-full sm:w-48"
                        selectedKey={quickFilter}
                        onSelectionChange={(key) => setQuickFilter(key as QuickFilter)}
                    >
                        <Label className="sr-only">Filter</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                            <ListBox>
                                <ListBox.Item id="all" textValue="Semua pengguna">
                                    <Label>Semua pengguna</Label>
                                </ListBox.Item>
                                <ListBox.Item id="role-admin" textValue="Role: Admin">
                                    <Label>Role: Admin</Label>
                                </ListBox.Item>
                                <ListBox.Item id="role-admin-opd" textValue="Role: Admin OPD">
                                    <Label>Role: Admin OPD</Label>
                                </ListBox.Item>
                                <ListBox.Item id="role-user" textValue="Role: User">
                                    <Label>Role: User</Label>
                                </ListBox.Item>
                                <ListBox.Item id="status-active" textValue="Status: Aktif">
                                    <Label>Status: Aktif</Label>
                                </ListBox.Item>
                                <ListBox.Item id="status-banned" textValue="Status: Dinonaktifkan">
                                    <Label>Status: Dinonaktifkan</Label>
                                </ListBox.Item>
                            </ListBox>
                        </Select.Popover>
                    </Select>
                </div>
            </div>

            {actionError && (
                <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
                    {actionError}
                </div>
            )}

            {/* Table */}
            <Table>
                <Table.ScrollContainer>
                    <Table.Content
                        aria-label="Tabel pengguna"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <Table.Header>
                            <Table.Column id="name" allowsSorting isRowHeader>
                                {({ sortDirection }) => (
                                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                                        Pengguna
                                    </Table.SortableColumnHeader>
                                )}
                            </Table.Column>
                            <Table.Column id="role">Role</Table.Column>
                            <Table.Column id="status">Status</Table.Column>
                            <Table.Column id="createdAt" allowsSorting>
                                {({ sortDirection }) => (
                                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                                        Bergabung
                                    </Table.SortableColumnHeader>
                                )}
                            </Table.Column>
                            <Table.Column id="actions">
                                <span className="sr-only">Aksi</span>
                            </Table.Column>
                        </Table.Header>

                        <Table.Body
                            items={isLoading ? [] : users}
                            renderEmptyState={() =>
                                isLoading ? null : (
                                    <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                                        <Trash />
                                        <span className="text-sm text-muted">No results found</span>
                                    </EmptyState>
                                )
                            }
                        >
                            {(user) => (
                                <Table.Row id={user.id}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <Avatar.Image src={user.image ?? undefined} alt={user.name} />
                                                <Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-sm text-muted">{user.email}</span>
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" color={ROLE_CHIP_COLOR[user.role ?? UserRole.USER]}>
                                            {ROLE_LABEL[user.role ?? UserRole.USER]}
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Chip size="sm" color={user.banned ? "danger" : "success"}>
                                            {user.banned ? "Dinonaktifkan" : "Aktif"}
                                        </Chip>
                                    </Table.Cell>
                                    <Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
                                    <Table.Cell>
                                        <Dropdown>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="tertiary"
                                                aria-label={`Aksi untuk ${user.name}`}
                                                isDisabled={isMutating}
                                            >
                                                <MoreVertical className="size-4" />
                                            </Button>
                                            <Dropdown.Popover>
                                                <Dropdown.Menu
                                                    onAction={(key) => {
                                                        switch (key) {
                                                            case "set-password":
                                                                setConfirmAction({ type: "set-password", user });
                                                                break;
                                                            case "impersonate":
                                                                handleImpersonate(user);
                                                                break;
                                                            case "ban":
                                                                setConfirmAction({ type: "ban", user });
                                                                break;
                                                            case "unban":
                                                                setConfirmAction({ type: "unban", user });
                                                                break;
                                                            case "delete":
                                                                setConfirmAction({ type: "delete", user });
                                                                break;
                                                        }
                                                    }}
                                                >
                                                    <Dropdown.SubmenuTrigger>
                                                        <Dropdown.Item id="change-role" textValue="Ubah role">
                                                            <UserCog className="size-4 text-muted" />
                                                            <Label>Ubah role</Label>
                                                            <Dropdown.SubmenuIndicator className="ms-auto" />
                                                        </Dropdown.Item>
                                                        <Dropdown.Popover>
                                                            <Dropdown.Menu
                                                                selectionMode="single"
                                                                selectedKeys={[user.role ?? UserRole.USER]}
                                                                onAction={(key) => handleSetRole(user, key as UserRole)}
                                                            >
                                                                {Object.values(UserRole).map((role) => (
                                                                    <Dropdown.Item key={role} id={role} textValue={ROLE_LABEL[role]}>
                                                                        <Label>{ROLE_LABEL[role]}</Label>
                                                                        <Dropdown.ItemIndicator>
                                                                            <Check className="size-4" />
                                                                        </Dropdown.ItemIndicator>
                                                                    </Dropdown.Item>
                                                                ))}
                                                            </Dropdown.Menu>
                                                        </Dropdown.Popover>
                                                    </Dropdown.SubmenuTrigger>
                                                    <Dropdown.Item id="set-password" textValue="Atur Ulang Password">
                                                        <KeyRound className="size-4 text-muted" />
                                                        <Label>Atur ulang password</Label>
                                                    </Dropdown.Item>
                                                    <Dropdown.Item id="impersonate" textValue="Login sebagai pengguna ini">
                                                        <LogIn className="size-4 text-muted" />
                                                        <Label>Login sebagai pengguna ini</Label>
                                                    </Dropdown.Item>
                                                    {user.banned ? (
                                                        <Dropdown.Item id="unban" textValue="Aktifkan Kembali">
                                                            <ShieldCheck className="size-4 text-muted" />
                                                            <Label>Aktifkan kembali</Label>
                                                        </Dropdown.Item>
                                                    ) : (
                                                        <Dropdown.Item id="ban" textValue="Nonaktifkan" variant="danger">
                                                            <Ban className="size-4" />
                                                            <Label>Nonaktifkan</Label>
                                                        </Dropdown.Item>
                                                    )}
                                                    <Dropdown.Item id="delete" textValue="Hapus" variant="danger">
                                                        <Trash2 className="size-4" />
                                                        <Label>Hapus pengguna</Label>
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown.Popover>
                                        </Dropdown>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>

                <Table.Footer>
                    {isLoading ? (
                        <div className="flex w-full flex-col gap-2 py-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-md" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-between">
                            <span className="text-sm text-muted">
                                {total === 0
                                    ? "0 hasil"
                                    : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} dari ${total} hasil`}
                            </span>
                            {/* <Pagination total={totalPages} page={page} onChange={setPage} /> */}
                        </div>
                    )}
                </Table.Footer>
            </Table>

            {/* Confirm: Ban */}
            <AlertDialog isOpen={confirmAction?.type === "ban"} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialog.Container>
                    <AlertDialog.Dialog>
                        <AlertDialog.Header>
                            <AlertDialog.Icon status="danger" />
                            <AlertDialog.Heading>Nonaktifkan pengguna ini?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p>
                                <strong>{confirmAction?.type === "ban" ? confirmAction.user.name : ""}</strong> tidak
                                akan bisa masuk lagi dan semua sesi aktifnya akan dicabut.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button variant="tertiary" onPress={() => setConfirmAction(null)}>
                                Batal
                            </Button>
                            <Button
                                variant="danger"
                                isDisabled={isMutating}
                                onPress={() => confirmAction?.type === "ban" && handleBan(confirmAction.user)}
                            >
                                Nonaktifkan
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog>

            {/* Confirm: Unban */}
            <AlertDialog isOpen={confirmAction?.type === "unban"} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialog.Container>
                    <AlertDialog.Dialog>
                        <AlertDialog.Header>
                            <AlertDialog.Icon status="accent" />
                            <AlertDialog.Heading>Aktifkan kembali pengguna ini?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p>
                                <strong>{confirmAction?.type === "unban" ? confirmAction.user.name : ""}</strong>{" "}
                                akan bisa masuk kembali ke aplikasi.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button variant="tertiary" onPress={() => setConfirmAction(null)}>
                                Batal
                            </Button>
                            <Button
                                variant="primary"
                                isDisabled={isMutating}
                                onPress={() => confirmAction?.type === "unban" && handleUnban(confirmAction.user)}
                            >
                                Aktifkan
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog>

            {/* Confirm: Delete */}
            <AlertDialog isOpen={confirmAction?.type === "delete"} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialog.Container>
                    <AlertDialog.Dialog>
                        <AlertDialog.Header>
                            <AlertDialog.Icon status="danger" />
                            <AlertDialog.Heading>Hapus pengguna secara permanen?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p>
                                Tindakan ini akan menghapus{" "}
                                <strong>{confirmAction?.type === "delete" ? confirmAction.user.name : ""}</strong>{" "}
                                beserta seluruh datanya dan tidak dapat dibatalkan.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button variant="tertiary" onPress={() => setConfirmAction(null)}>
                                Batal
                            </Button>
                            <Button
                                variant="danger"
                                isDisabled={isMutating}
                                onPress={() => confirmAction?.type === "delete" && handleDelete(confirmAction.user)}
                            >
                                Hapus Permanen
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog>

            {/* Set password */}
            <AlertDialog
                isOpen={confirmAction?.type === "set-password"}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmAction(null);
                        setNewPassword("");
                    }
                }}
            >
                <AlertDialog.Container>
                    <AlertDialog.Dialog>
                        <AlertDialog.Header>
                            <AlertDialog.Icon status="accent" />
                            <AlertDialog.Heading>Atur ulang password</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className="mb-3 text-sm text-muted">
                                Password baru untuk{" "}
                                <strong>{confirmAction?.type === "set-password" ? confirmAction.user.name : ""}</strong>
                            </p>
                            <TextField type="password" value={newPassword} onChange={(v) => setNewPassword(v)} autoFocus>
                                <Label>Password baru</Label>
                                <Input placeholder="Minimal 8 karakter" />
                            </TextField>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button
                                variant="tertiary"
                                onPress={() => {
                                    setConfirmAction(null);
                                    setNewPassword("");
                                }}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="primary"
                                isDisabled={isMutating || newPassword.length < 8}
                                onPress={() =>
                                    confirmAction?.type === "set-password" && handleSetPassword(confirmAction.user)
                                }
                            >
                                Simpan
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog>
        </div>
    );
}