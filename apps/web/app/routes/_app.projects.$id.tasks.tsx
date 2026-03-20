import { useParams } from 'react-router';

export default function ProjectTasksPage() {
  const { id } = useParams();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Project Tasks</h1>
      {id ? (
        <p className="mt-2 text-sm font-medium text-muted-foreground">{id}</p>
      ) : null}
    </div>
  );
}
