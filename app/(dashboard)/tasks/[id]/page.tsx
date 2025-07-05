import { Task } from "@/components/task";

interface TaskPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const generateMetadata = async ({ params }: TaskPageProps) => {
  const { id } = await params;

  if (!id) {
    return {
      title: "Task not found",
    };
  }

  return {
    title: `Task / ${id} - Pullsmith`,
    description: `Task / ${id}`,
  };
};

const TaskPage = async ({ params }: TaskPageProps) => {
  const { id } = await params;

  return <Task id={id} />;
};

export default TaskPage;
