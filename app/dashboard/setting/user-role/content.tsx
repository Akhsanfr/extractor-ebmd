"use client";

import { useEffect, useState } from "react";

import { UserContract } from "@/action/user/user/user.contract";
import { actionGetListUserWithRole } from "@/action/user/user/user.action";
import { actionSyncUserRoles } from "@/action/user/userRole/userRole.action";
import { UserRole } from "@/enum/user";
import {
  Chip,
  Button,
  Select,
  Label,
  ListBox,
  Table,
  toast,
  Modal,
  Skeleton,
  useOverlayState,
} from "@heroui/react";
import { Settings } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { UserRoleContract } from "@/action/user/userRole/userRole.contract";

export default function Content() {
  const [users, setUsers] = useState<UserContract.SelectWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<UserContract.SelectWithRole | null>(null);
  const state = useOverlayState();

  const form = useForm<UserRoleContract.SyncRoles>({
    defaultValues: {
      userId: "",
      roles: [],
    },
  });

  const getListUserWithRole = async () => {
    try {
      setIsLoading(true);
      const result = await actionGetListUserWithRole();
      if (!result.success) throw result.error;
      setUsers(result.data);
    } catch (err: any) {
      toast.danger("Gagal memuat data akun", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getListUserWithRole();
  }, []);

  const openRoleModal = (user: UserContract.SelectWithRole) => {
    setSelectedUser(user);
    form.reset({
      userId: user.id,
      roles: user.roles,
    });
    state.open();
  };

  const closeRoleModal = () => {
    state.close();
    setSelectedUser(null);
    form.reset({ userId: "", roles: [] });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const result = await actionSyncUserRoles({
        userId: selectedUser.id,
        roles: values.roles,
      });
      if (!result.success) throw result.error;

      toast.success(`Role ${selectedUser.name} diperbarui`);
      await getListUserWithRole();
      closeRoleModal();
    } catch (err: any) {
      toast.danger("Gagal mengubah role", {
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Manajemen Akun
        </h1>
        <p className="text-sm text-muted">
          Kelola akun dan role pengguna aplikasi.
        </p>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Tabel user">
            <Table.Header>
              <Table.Column isRowHeader>Nama</Table.Column>
              <Table.Column>Email</Table.Column>
              <Table.Column>Role</Table.Column>
              <Table.Column>Aksi</Table.Column>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Table.Row key={`skeleton-${i}`} id={`skeleton-${i}`}>
                    <Table.Cell>
                      <Skeleton className="h-4 w-32 rounded" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className="h-4 w-40 rounded" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </Table.Cell>
                    <Table.Cell>
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : users.length === 0 ? (
                <Table.Row id="empty">
                  <Table.Cell colSpan={4}>
                    <p className="py-6 text-center text-sm text-muted">
                      Belum ada akun.
                    </p>
                  </Table.Cell>
                </Table.Row>
              ) : (
                users.map((user) => (
                  <Table.Row key={user.id} id={String(user.id)}>
                    <Table.Cell>{user.name}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted">
                            Tanpa role
                          </span>
                        ) : (
                          user.roles.map((role) => (
                            <Chip
                              key={role}
                              variant={
                                role === UserRole.ADMIN
                                  ? "primary"
                                  : "secondary"
                              }
                            >
                              {role.toUpperCase()}
                            </Chip>
                          ))
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Atur role ${user.name}`}
                        onPress={() => openRoleModal(user)}
                      >
                        <Settings className="size-4" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Modal isOpen={state.isOpen} onOpenChange={(open) => !open && closeRoleModal()}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon>
                  <Settings className="size-5" />
                </Modal.Icon>
                <Modal.Heading>
                  Atur Role {selectedUser ? `— ${selectedUser.name}` : ""}
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                <form
                  id="sync-role-form"
                  onSubmit={onSubmit}
                  className="flex flex-col gap-2"
                >
                  <Controller
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <Select
                        fullWidth
                        selectionMode="multiple"
                        placeholder="Pilih role"
                        value={field.value}
                        onChange={(value) =>
                          field.onChange(
                            Array.isArray(value) ? value : value ? [value] : []
                          )
                        }
                      >
                        <Label>Role</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {Object.values(UserRole).map((role) => (
                              <ListBox.Item key={role} id={role} textValue={role.toUpperCase()}>
                                {role.toUpperCase()}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    )}
                  />
                </form>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="secondary"
                  onPress={closeRoleModal}
                  isDisabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  form="sync-role-form"
                  isPending={isSubmitting}
                  isDisabled={isSubmitting}
                >
                  Simpan
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}