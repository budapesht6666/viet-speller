-- CreateTable
CREATE TABLE "Avatar" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "image" BLOB NOT NULL,
    "type" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
