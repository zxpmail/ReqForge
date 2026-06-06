import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to {{projectName}}</h1>
      <p className="text-lg text-gray-600 mb-8">
        Get started by editing <code className="bg-gray-100 px-2 py-1 rounded">src/app/page.tsx</code>
      </p>
      <div className="flex gap-4">
        <Link
          href="/api/hello"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Test API
        </Link>
      </div>
    </main>
  );
}
