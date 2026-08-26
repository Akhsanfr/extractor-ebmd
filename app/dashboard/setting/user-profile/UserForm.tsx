"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import {
  Button,
  Modal,
  TextField,
  Label,
  Input,
  FieldError,
  Select,
  ListBox,
  toast,
} from "@heroui/react";

import { UserProfileContract } from "@/action/user/userProfile/user-profile.contract";
import { createUserProfileAction } from "@/action/user/userProfile/user-profile.action.create";

import { UserContract } from "@/action/user/user/user.contract";
import { OperationalError } from "@/action/actionResponse";

export default function UserForm({ onCreated, user }: { onCreated: () => void, user: UserContract.SelectDTO[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserProfileContract.CreateDTO>({
    resolver: zodResolver(UserProfileContract.create),
    defaultValues: {
      userId: "",
      nama: "",
      nip: "",
      wa: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset({ userId: null, nama: "", nip: "", wa: "" });
      setServerError(null);
    }
  };

  const onSubmit = async (values: UserProfileContract.CreateDTO) => {

    try {
      const result = await createUserProfileAction(
        values
      );
      console.log(result);
      if (!result.success) throw result.error
      onCreated();
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof OperationalError) {
        toast.danger(error.message);
      } else {
        toast.danger("Terjadi kesalahan tak terduga.");
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button variant="primary" onPress={() => setIsOpen(true)}>
        <Plus size={16} />
        Tambah User
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />

            {/* ===== Modal stack: header ===== */}
            <Modal.Header>
              <Modal.Heading>Tambah User</Modal.Heading>
            </Modal.Header>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* ===== Modal stack: form (body) ===== */}
              <Modal.Body className="flex flex-col gap-4">
                {serverError && (
                  <p className="text-sm text-danger">{serverError}</p>
                )}

                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      isInvalid={!!errors.userId}
                    >
                      <Label>User</Label>
                      <Select.Trigger onBlur={field.onBlur}>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {user.map((u) => (
                            <ListBox.Item
                              key={u.id}
                              id={u.id}
                              textValue={u.email}
                            >
                              {u.email}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                      <FieldError>{errors.userId?.message}</FieldError>
                    </Select>
                  )}
                />

                <TextField isInvalid={!!errors.nama}>
                  <Label>Nama</Label>
                  <Input placeholder="Masukkan nama" {...register("nama")} />
                  <FieldError>{errors.nama?.message}</FieldError>
                </TextField>

                <TextField isInvalid={!!errors.nip}>
                  <Label>NIP</Label>
                  <Input placeholder="Masukkan NIP" {...register("nip")} />
                  <FieldError>{errors.nip?.message}</FieldError>
                </TextField>

                <TextField isInvalid={!!errors.wa}>
                  <Label>No. WhatsApp</Label>
                  <Input placeholder="08xxxxxxxxxx" {...register("wa")} />
                  <FieldError>{errors.wa?.message}</FieldError>
                </TextField>
              </Modal.Body>

              {/* ===== Modal stack: footer ===== */}
              <Modal.Footer>
                <Button
                  type="button"
                  variant="secondary"
                  onPress={() => handleOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" isPending={isSubmitting}>
                  Simpan
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}