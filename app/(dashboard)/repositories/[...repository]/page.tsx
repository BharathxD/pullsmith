import { notFound } from "next/navigation";
import { RepositoryOverview } from "@/components/repository-overview";

interface RepositoryPageProps {
  params: Promise<{
    repository: string[];
  }>;
}

export const generateMetadata = async ({ params }: RepositoryPageProps) => {
  const { repository } = await params;

  if (!repository || repository.length < 2) {
    return {
      title: "Repository not found",
    };
  }

  const [owner, repo] = repository;

  return {
    title: `${owner}/${repo} - Pullsmith`,
    description: `Browse and edit files in ${owner}/${repo} repository`,
  };
};

const RepositoryPage = async ({ params }: RepositoryPageProps) => {
  const { repository } = await params;

  // Handle repository path like ['owner', 'repo'] or ['owner', 'repo', 'path', 'to', 'file']
  if (!repository || repository.length < 2) {
    notFound();
  }

  const [owner, repo] = repository;

  return <RepositoryOverview owner={owner} repo={repo} />;
};

export default RepositoryPage;
