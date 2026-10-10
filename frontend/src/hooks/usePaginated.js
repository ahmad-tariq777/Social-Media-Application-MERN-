import { useCallback, useEffect, useRef, useState } from "react";

export default function usePaginated(fetchPage, resetKey) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchPage);
  const loadingRef = useRef(false);
  const requestRef = useRef(0);

  fetchRef.current = fetchPage;

  const load = useCallback(async (nextPage) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const requestId = requestRef.current;
    setLoading(true);
    try {
      const result = await fetchRef.current(nextPage);
      if (requestId !== requestRef.current) return;
      setItems((prev) => (nextPage === 1 ? result.items : [...prev, ...result.items]));
      setHasMore(Boolean(result.hasMore));
      setPage(nextPage);
      setError(null);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err);
      setHasMore(false);
    } finally {
      if (requestId === requestRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    requestRef.current += 1;
    loadingRef.current = false;
    setItems([]);
    setPage(1);
    setError(null);
    if (resetKey === null) {
      setHasMore(false);
      setLoading(false);
      return;
    }
    setHasMore(true);
    load(1);
  }, [resetKey, load]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) load(page + 1);
  }, [hasMore, load, page]);

  const reload = useCallback(() => {
    requestRef.current += 1;
    loadingRef.current = false;
    load(1);
  }, [load]);

  return { items, setItems, loading, hasMore, error, loadMore, reload };
}
