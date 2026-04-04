import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Diary tab — redirects to the Routine screen's Diary segment.
 * All diary content now lives inside the Routine screen (4th tab).
 */
export default function DiaryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/(screens)/routine', params: { tab: '3' } } as any);
  }, []);

  return null;
}
