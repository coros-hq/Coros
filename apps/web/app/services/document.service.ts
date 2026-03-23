import { api, http } from '~/lib/api';

export interface ApiDocument {
  id: string;
  name: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  organizationId: string;
  uploadedById: string;
  employeeId?: string | null;
  employee?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export async function getAllDocuments(): Promise<ApiDocument[]> {
  return api.get<ApiDocument[]>('/documents');
}

export async function getDocumentsByEmployee(
  employeeId: string
): Promise<ApiDocument[]> {
  return api.get<ApiDocument[]>(`/documents?employeeId=${encodeURIComponent(employeeId)}`);
}

export async function uploadDocument(
  file: File,
  employeeId?: string | null
): Promise<ApiDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (employeeId) {
    formData.append('employeeId', employeeId);
  }
  const res = await http.post<ApiDocument>('/documents', formData, {
    headers: { 'Content-Type': undefined },
  });
  return res.data as ApiDocument;
}

export async function deleteDocument(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/documents/${id}`);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sanitize document name for display (fixes encoding artifacts and mojibake). */
export function sanitizeDocumentName(name: string): string {
  const mojibakeMap: Record<string, string> = {
    'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â', 'Ã®': 'î', 'Ã´': 'ô',
    'Ã¯': 'ï', 'Ã»': 'û', 'Ã¼': 'ü', 'Ã¶': 'ö', 'Ã¤': 'ä', 'Ã±': 'ñ',
    'Ã§': 'ç', 'Ã‰': 'É', 'Ã€': 'À',
    'ð': '', // common artifact, remove
  };
  let s = name.replace(/[\x00-\x1F\x7F]/g, '');
  for (const [bad, good] of Object.entries(mojibakeMap)) {
    s = s.replaceAll(bad, good);
  }
  return s.replace(/\s+/g, ' ').trim() || name;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf')) return 'file-text';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'application/vnd.ms-excel'
  )
    return 'table';
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType === 'application/msword'
  )
    return 'file-text';
  return 'file';
}
