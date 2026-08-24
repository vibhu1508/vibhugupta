import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DetailPage from "@/components/DetailPage";
import { profile, roles } from "@/content/profile";

export function generateStaticParams() {
  return roles.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const role = roles.find((r) => r.id === id);
  if (!role) return {};
  return {
    title: `${role.title} at ${role.company} — ${profile.name}`,
    description: role.highlights[0],
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = roles.find((r) => r.id === id);
  if (!role) notFound();

  return (
    <DetailPage
      kicker="Experience"
      title={role.company}
      subtitle={role.title}
      meta={[role.period, role.location, role.mode]}
      stack={role.stack}
      highlights={role.highlights}
      detail={role.detail}
      photos={role.photos}
      backHref="/#work"
      backLabel="All experience"
    />
  );
}
