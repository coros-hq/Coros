import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Field, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useBranding } from '~/stores/branding.store';
import { DEFAULT_BRAND_HEX } from '~/lib/brand-theme';
import { cn } from '~/lib/utils';
import { patchOrganizationBranding } from '~/services/organization.service';
import { useAuthStore } from '~/stores/auth.store';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function BrandingSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { branding, setBranding } = useBranding();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const [color, setColor] = useState(
    () => branding.brandColor ?? DEFAULT_BRAND_HEX
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setColor(branding.brandColor ?? DEFAULT_BRAND_HEX);
  }, [branding.brandColor]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      navigate('/settings', { replace: true });
    }
  }, [user, navigate]);

  const displayLogo = preview ?? branding.logoUrl ?? null;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (f.size > MAX_LOGO_BYTES) {
      setError('Logo must be 2MB or smaller.');
      e.target.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Use JPG, PNG, or WebP.');
      e.target.value = '';
      return;
    }
    setFile(f);
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    if (!user?.organizationId) return;
    setStatus('saving');
    setError(null);
    try {
      const fd = new FormData();
      fd.append('brandColor', color);
      if (file) fd.append('logo', file);
      const data = await patchOrganizationBranding(user.organizationId, fd);
      setBranding({
        logoUrl: data.logoUrl,
        brandColor: data.brandColor,
      });
      setFile(null);
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
      setPreview(null);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: unknown) {
      setStatus('error');
      setError((e as { message?: string })?.message ?? 'Failed to save');
    }
  }

  if (!user) return null;

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">Branding</h1>
            </div>,
            headerPortal.current
          )
        : null}

      <div className="mx-auto w-full max-w-lg px-4 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-foreground">Branding</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Logo and primary color for your workspace
          </p>
        </div>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Workspace appearance</CardTitle>
            <CardDescription className="text-xs">
              Shown in the sidebar and sign-in experience after you save.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0">
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {displayLogo ? (
                    <img
                      src={displayLogo}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-2xs text-muted-foreground">
                      No logo
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <Input
                    accept="image/jpeg,image/png,image/webp"
                    className="cursor-pointer text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium"
                    onChange={onFileChange}
                    type="file"
                  />
                  <p className="text-2xs text-muted-foreground">
                    JPG, PNG, or WebP · max 2MB
                  </p>
                </div>
              </div>
            </Field>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Primary color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  className={cn(
                    'h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1',
                    'shadow-sm'
                  )}
                  onChange={(e) => setColor(e.target.value)}
                  type="color"
                  value={color}
                />
                <span className="font-mono text-sm text-muted-foreground">
                  {color}
                </span>
              </div>
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={status === 'saving'}
                onClick={() => void handleSave()}
                size="sm"
              >
                {status === 'saving' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save
              </Button>
              {status === 'success' ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
