import { and, eq, isNull } from "drizzle-orm";
import type { UserProfileContract } from "./user-profile.contract";
import { userProfileTable } from "@/drizzle/schema";
import { DbOrTx } from "@/action/baseDbOrTx";

export const userProfileRepository = {
  async insert(db: DbOrTx, input: UserProfileContract.InsertDTO) {
    const [row] = await db
      .insert(userProfileTable)
      .values({ ...input })
      .returning();

    return row;
  },

  async findAll(db: DbOrTx) {
    return db
      .select()
      .from(userProfileTable)
      .where(isNull(userProfileTable.deletedAt));
  },

  async findById(db: DbOrTx, id: number) {
    const [row] = await db
      .select()
      .from(userProfileTable)
      .where(
        and(eq(userProfileTable.id, id), isNull(userProfileTable.deletedAt))
      );

    return row ?? null;
  },

  async findByUserId(db: DbOrTx, userId: string) {
    const [row] = await db
      .select()
      .from(userProfileTable)
      .where(
        and(
          eq(userProfileTable.userId, userId),
          isNull(userProfileTable.deletedAt)
        )
      );

    return row ?? null;
  },

  async update(
    db: DbOrTx,
    input: UserProfileContract.EditDTO,
    userId: string
  ) {
    const [row] = await db
      .update(userProfileTable)
      .set({ ...input, updatedAt: new Date(), updatedBy: userId })
      .where(
        and(eq(userProfileTable.id, input.id), isNull(userProfileTable.deletedAt))
      )
      .returning();

    return row ?? null;
  },

  async softDelete(db: DbOrTx, id: number, userId: string) {
    const [row] = await db
      .update(userProfileTable)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
      })
      .where(
        and(eq(userProfileTable.id, id), isNull(userProfileTable.deletedAt))
      )
      .returning();

    return row ?? null;
  },
};
