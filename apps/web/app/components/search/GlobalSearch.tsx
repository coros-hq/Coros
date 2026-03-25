import {
  CheckSquare,
  FileText,
  FolderKanban,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import {
  Dialog,
  DialogContent,
} from '~/components/ui/dialog';
import type { SearchResults } from '~/services/search.service';
import { searchService } from '~/services/search.service';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchService.search(query);
        setResults(data);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setQuery('');
      setResults(null);
    }
  }

  const hasNoResults =
    query.length >= 2 &&
    !isLoading &&
    results &&
    results.employees.length === 0 &&
    results.projects.length === 0 &&
    results.tasks.length === 0 &&
    results.documents.length === 0;

  return (
    <>
      <Button
        variant="outline"
        className="h-8 w-48 justify-start gap-2 text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        Search...
        <kbd className="ml-auto text-xs text-muted-foreground">⌘K</kbd>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="p-0 gap-0 max-w-lg outline-none focus:outline-none focus:ring-0 focus-visible:ring-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search employees, projects, tasks..."
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0 focus:outline-none"
            />

            <CommandList className="max-h-96">
              {query.length < 2 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}

              {hasNoResults && (
                <CommandEmpty>No results for &quot;{query}&quot;</CommandEmpty>
              )}

              {results?.employees.length > 0 && (
                <CommandGroup heading="Employees">
                  {results.employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      onSelect={() => {
                        navigate(`/employees/${employee.id}`);
                        handleOpenChange(false);
                      }}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-[10px]">
                          {(employee.firstName?.[0] ?? '') + (employee.lastName?.[0] ?? '') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {employee.firstName} {employee.lastName}
                        </span>
                        {employee.position?.name && (
                          <span className="text-xs text-muted-foreground">
                            {employee.position.name}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.projects.length > 0 && (
                <CommandGroup heading="Projects">
                  {results.projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      onSelect={() => {
                        navigate(`/projects/${project.id}/tasks`);
                        handleOpenChange(false);
                      }}
                    >
                      <FolderKanban className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm">{project.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {project.status}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.tasks.length > 0 && (
                <CommandGroup heading="Tasks">
                  {results.tasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      onSelect={() => {
                        navigate(`/projects/${task.projectId}/tasks`);
                        handleOpenChange(false);
                      }}
                    >
                      <CheckSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm">{task.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.documents.length > 0 && (
                <CommandGroup heading="Documents">
                  {results.documents.map((doc) => (
                    <CommandItem
                      key={doc.id}
                      onSelect={() => {
                        window.open(doc.url, '_blank');
                        handleOpenChange(false);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{doc.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
