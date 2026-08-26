"use client";

import { useCallback, useEffect, useState } from "react";

import UserForm from "./UserForm";
import UserTable from "./UserTable";
import { UserProfileContract } from "@/action/user/userProfile/user-profile.contract";
import { actionGetListUserProfile } from "@/action/user/userProfile/user-profile.action.read";
import { UserContract } from "@/action/user/user/user.contract";
import { actionGetListUser } from "@/action/user/user/user.action";

export interface UserOption {
  id: string;
  name: string;
}

export default function Content() {
  const [list, setList] = useState<UserProfileContract.SelectDTO[]>([]);
  const [user, setUser] = useState<UserContract.SelectDTO[]>([])
  const [isLoading, setIsLoading] = useState(true);

  const getListUserProfile = async () => {
    try {
      setIsLoading(true);
      const result = await actionGetListUserProfile();
      if (!result.success) throw result.error
      setList(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  const getListUser = async () => {
    try {
      setIsLoading(true);
      const result = await actionGetListUser();
      if (!result.success) throw result.error
      setUser(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => { getListUserProfile(); getListUser() }, [])
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          Manajemen Pegawai
        </h1>

        <UserForm onCreated={getListUserProfile} user={user} />
      </div>

      <UserTable users={list} isLoading={isLoading} />
    </div>
  );
}