import { useCallback, useEffect, useState } from 'react';
import type { ApiDocument } from '~/services/document.service';
import {
  getDocumentsByEmployee,
  uploadDocument,
  deleteDocument,
} from '~/services/document.service';

export function useEmployeeDocuments(employeeId: string | undefined) {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const refetch = useCallback(async () => {
    if (!employeeId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDocumentsByEmployee(employeeId);
      setDocuments(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load documents';
      setError(msg);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upload = useCallback(
    async (file: File) => {
      if (!employeeId) return;
      setIsUploading(true);
      setError(null);
      try {
        const doc = await uploadDocument(file, employeeId);
        setDocuments((prev) => [doc, ...prev]);
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Failed to upload document';
        setError(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [employeeId]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      await refetch();
    },
    [refetch]
  );

  return {
    documents,
    isLoading,
    error,
    isUploading,
    refetch,
    upload,
    remove,
  };
}
