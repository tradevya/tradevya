import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; day?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();
  const categories = Array.isArray(params.category) ? params.category : params.category ? [params.category] : [];
  const days = Array.isArray(params.day) ? params.day : params.day ? [params.day] : [];

  categories.forEach((category) => nextParams.append("category", category));
  days.forEach((day) => nextParams.append("day", day));

  const query = nextParams.toString();
  redirect(query ? `/dashboard?${query}` : "/dashboard");
}
