'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/student/community/discussions');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-white min-h-screen">
      <span className="text-neutral-500">Redirecting to Discussions...</span>
    </div>
  );
}
