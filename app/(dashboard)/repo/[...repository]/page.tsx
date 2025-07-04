import { notFound } from "next/navigation";

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {owner}/{repo}
          </h1>
          <p className="text-muted-foreground">
            Repository file browser and coding agent workspace
          </p>
        </div>
      </div>
    </div>
  );
};

export default RepositoryPage;
