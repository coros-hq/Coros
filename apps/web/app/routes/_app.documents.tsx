import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import { Button } from '~/components/ui/button';

export default function DocumentsPage() {
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Documents</h1>
              <Button
                className="h-7 bg-primary text-xs font-semibold text-white hover:bg-primary/90"
                size="sm"
                type="button"
              >
                + Add document
              </Button>
            </div>,
            headerPortal.current,
          )
        : null}
      <div className="p-6">
        <p className="text-base font-medium text-foreground">Coming soon.</p>
      </div>
    </>
  );
}
