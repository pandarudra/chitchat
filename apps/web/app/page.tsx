"use client";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <Link
        href="/auth/signup"
        className="bg-blue-500 text-white h-10 w-20 px-4 rounded"
      >
        Go to chat
      </Link>
    </div>
  );
}
