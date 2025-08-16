import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  // Eğer kullanıcı giriş yapmışsa, onu doğrudan dashboard'a yönlendir
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold mb-4">
          Prompt Merkez'e Hoş Geldiniz
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          AI prompt'larınızı yönetin, test edin ve optimize edin.
        </p>
        <div className="space-x-4">
          <Link href="/sign-in" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Giriş Yap
          </Link>
          <Link href="/sign-up" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
            Kayıt Ol
          </Link>
        </div>
      </div>
    </main>
  );
}
