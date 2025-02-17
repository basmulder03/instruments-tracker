-- CreateTable
CREATE TABLE "MutationLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "mutation" TEXT NOT NULL,
    "entity" TEXT NOT NULL,

    CONSTRAINT "MutationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MutationLog" ADD CONSTRAINT "MutationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
