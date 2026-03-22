import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { authService } from '~/services/auth.service';
import { industryService } from '~/services/industry.service';
import type { Industry } from '~/services/industry.service';
import { useAuthStore } from '~/stores/auth.store';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState<string | null>(null);

  const [form, setForm] = useState({
    organizationName: '',
    industryId: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIndustriesLoading(true);
      setIndustriesError(null);
      try {
        const list = await industryService.list();
        if (!cancelled) setIndustries(list);
      } catch {
        if (!cancelled) {
          setIndustries([]);
          setIndustriesError('Could not load industries. Try again later.');
        }
      } finally {
        if (!cancelled) setIndustriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.industryId) {
      setError('Please select an industry.');
      return;
    }
    setLoading(true);
    try {
      const { user, accessToken } = await authService.register(form);
      setAuth(user, accessToken);
      navigate('/');
    } catch (err: unknown) {
      let message = 'Something went wrong.';
      if (err && typeof err === 'object') {
        const o = err as { message?: unknown; errors?: Array<{ message?: string }> };
        if (typeof o.message === 'string') message = o.message;
        else if (Array.isArray(o.errors) && o.errors[0]?.message) message = o.errors[0].message!;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const formBusy = loading || industriesLoading;

  const industryPlaceholder = industriesLoading
    ? 'Loading industries…'
    : industries.length === 0
      ? 'No industries available'
      : 'Select your industry';

  /** Base UI may render the raw `value` (UUID) in the trigger; explicit children forces the label. */
  const industryTriggerLabel = form.industryId
    ? industries.find((i) => i.id === form.industryId)?.name ?? '—'
    : undefined;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your workspace</h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Spin up Coros for your organization in minutes.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="organizationName"
          >
            Organization
          </Label>
          <Input
            autoComplete="organization"
            className="h-10"
            disabled={formBusy}
            id="organizationName"
            onChange={patch('organizationName')}
            placeholder="Acme Inc."
            required
            value={form.organizationName}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="industry"
          >
            Industry
          </Label>
          <Select
            disabled={formBusy || industries.length === 0}
            onValueChange={(val) => setForm((f) => ({ ...f, industryId: val }))}
            value={form.industryId || undefined}
          >
            <SelectTrigger className="h-10 w-full" id="industry">
              <SelectValue placeholder={industryPlaceholder}>{industryTriggerLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {industries.map((ind) => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {industriesError ? (
          <div className="rounded bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
            {industriesError}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="email"
          >
            Work email
          </Label>
          <Input
            autoComplete="email"
            className="h-10"
            disabled={formBusy}
            id="email"
            onChange={patch('email')}
            placeholder="you@company.com"
            required
            type="email"
            value={form.email}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-xs font-medium uppercase tracking-wide text-foreground-muted"
            htmlFor="password"
          >
            Password
          </Label>
          <Input
            autoComplete="new-password"
            className="h-10"
            disabled={formBusy}
            id="password"
            minLength={8}
            onChange={patch('password')}
            placeholder="Min. 8 characters"
            required
            type="password"
            value={form.password}
          />
        </div>

        {error ? (
          <div className="rounded bg-destructive-muted px-3 py-2.5 text-sm text-destructive">{error}</div>
        ) : null}

        <Button
          className="h-10 w-full bg-purple font-semibold text-white hover:bg-purple-mid"
          disabled={formBusy || industries.length === 0}
          type="submit"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Creating workspace…
            </span>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-foreground-subtle">
        By continuing you agree to the{' '}
        <a className="underline underline-offset-4" href="#">
          Coros Terms of Service
        </a>
        .
      </p>

      <div className="mt-6 border-t border-canvas-border pt-6">
        <p className="text-center text-sm text-foreground-muted">
          Already have an account?{' '}
          <Link
            className="font-semibold text-purple underline-offset-4 hover:text-purple-mid hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
