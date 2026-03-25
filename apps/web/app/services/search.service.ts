import { api } from '~/lib/api';

export interface SearchResults {
  employees: Array<{
    id: string;
    firstName: string;
    lastName: string;
    department?: { name: string } | null;
    position?: { name: string } | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    projectId: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
  }>;
}

export const searchService = {
  search: async (query: string): Promise<SearchResults> => {
    return api.get<SearchResults>(
      `/search?q=${encodeURIComponent(query)}`
    );
  },
};
