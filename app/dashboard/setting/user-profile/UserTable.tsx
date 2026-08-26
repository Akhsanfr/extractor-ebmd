"use client";

import { Table } from "@heroui/react";

import { UserProfileContract } from "@/action/user/userProfile/user-profile.contract";

interface UserTableProps {
  users: UserProfileContract.SelectDTO[];
  isLoading?: boolean;
}

export default function UserTable({ users, isLoading }: UserTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Tabel user">
          <Table.Header>
            <Table.Column isRowHeader>Nama</Table.Column>
            <Table.Column>NIP</Table.Column>
            <Table.Column>No. WhatsApp</Table.Column>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={3} className="text-center text-muted">
                  Memuat data...
                </Table.Cell>
              </Table.Row>
            ) : users.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3} className="text-center text-muted">
                  Belum ada data user
                </Table.Cell>
              </Table.Row>
            ) : (
              users.map((user) => (
                <Table.Row key={user.id} id={String(user.id)}>
                  <Table.Cell>{user.nama}</Table.Cell>
                  <Table.Cell>{user.nip ?? "-"}</Table.Cell>
                  <Table.Cell>{user.wa ?? "-"}</Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}