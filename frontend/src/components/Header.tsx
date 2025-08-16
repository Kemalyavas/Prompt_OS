import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export const Header = async () => {
  const { userId } = await auth();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Prompt Merkez
        </Link>
        <div>
          {userId ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-in">Giriş Yap</Link>
          )}
        </div>
      </div>
    </header>
  );
};