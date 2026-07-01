import { useState, useEffect, useRef } from 'react';
import { db, dbNotifier } from './database';

/**
 * Custom hook to subscribe to a local SQLite table.
 * Resolves with local event listening rather than Firestore onSnapshot.
 */
export function useLiveTable<T>(
  tableName: keyof typeof db,
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
) {
  const [rawDocuments, setRawDocuments] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const filterRef = useRef(filterFn);
  const sortRef = useRef(sortFn);
  filterRef.current = filterFn;
  sortRef.current = sortFn;

  useEffect(() => {
    if (!tableName || !db[tableName]) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await db[tableName].toArray();
        if (isMounted) {
          setRawDocuments(data as any);
          setLoading(false);
        }
      } catch (error) {
        console.error(`Error fetching table ${tableName}:`, error);
        if (isMounted) setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Subscribe to local notifier events for this table
    const handleUpdate = () => {
      fetchData();
    };

    dbNotifier.addEventListener(tableName, handleUpdate);

    return () => {
      isMounted = false;
      dbNotifier.removeEventListener(tableName, handleUpdate);
    };
  }, [tableName]);

  // Apply filter/sort in a separate memo-like step.
  const [documents, setDocuments] = useState<T[]>([]);
  useEffect(() => {
    let results = rawDocuments;
    if (filterRef.current) {
      results = results.filter(filterRef.current);
    }
    if (sortRef.current) {
      results = [...results].sort(sortRef.current);
    }
    setDocuments(results);
  }, [rawDocuments, filterFn, sortFn]);

  return { documents, loading, error: null };
}

/**
 * Fetch a single local document by ID with local updates subscription.
 */
export function useLiveDocument<T>(
  tableName: keyof typeof db,
  id: string | null
) {
  const [document, setDocument] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableName || !db[tableName] || !id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchDoc = async () => {
      try {
        const doc = await db[tableName].get(id);
        if (isMounted) {
          setDocument(doc || null);
          setLoading(false);
        }
      } catch (error) {
        console.error(`Error fetching document ${tableName}/${id}:`, error);
        if (isMounted) setLoading(false);
      }
    };

    fetchDoc();

    // Listen to changes in the table
    const handleUpdate = () => {
      fetchDoc();
    };

    dbNotifier.addEventListener(tableName, handleUpdate);

    return () => {
      isMounted = false;
      dbNotifier.removeEventListener(tableName, handleUpdate);
    };
  }, [tableName, id]);

  return { document, loading, error: null };
}

