import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB] px-4 text-[#1A1F25]">
      <h1 className="text-6xl font-bold tracking-tight text-[#D4B2A7]">404</h1>
      <p className="mt-4 text-lg text-[#6E7A8A]">Сторінку не знайдено</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1A1F25] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#2C323B]"
      >
        На головну
      </Link>
    </div>
  );
}
