import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DetailPage from "@/components/DetailPage";
import { profile, projects } from "@/content/profile";

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) return {};
  return {
    title: `${project.name} — ${profile.name}`,
    description: project.tagline.en,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <DetailPage
      kicker="Project"
      title={project.name}
      subtitle={project.tagline.en}
      stack={project.stack}
      highlights={project.highlights}
      detail={project.detail}
      photos={project.photos}
      links={project.links}
      backHref="/#projects"
      backLabel="All projects"
    />
  );
}
