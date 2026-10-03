import { useEffect } from 'react';

/**
 * Hook to protect against accidental navigation or tab closure
 * when there are unsaved changes.
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Modern browsers ignore this string but require it to be set to show the prompt
        e.returnValue = 'You have unsaved changes. If you leave now, your changes will not be saved.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
}
