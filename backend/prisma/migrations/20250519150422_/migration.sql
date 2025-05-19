-- CreateTable
CREATE TABLE "auctions_history" (
    "id" SERIAL NOT NULL,
    "winnerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auctions_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "auctions_history" ADD CONSTRAINT "auctions_history_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
