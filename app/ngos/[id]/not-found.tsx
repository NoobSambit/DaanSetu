import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">NGO Not Found</h2>
        <p className="text-gray-600 mb-8">
          The NGO you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/ngos"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-block"
        >
          Browse All NGOs
        </Link>
      </div>
    </div>
  );
}
