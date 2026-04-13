import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Building2,
  CheckCircle2,
  Globe,
  Lock,
  Loader2,
  Palette,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { authService } from '~/services/auth.service';
import {
  getOrganizationMe,
  updateOrganizationMe,
  type ApiOrganization,
  type OrganizationSize,
} from '~/services/organization.service';
import { getUserMe, updateUserMe } from '~/services/user.service';
import { useAuthStore } from '~/stores/auth.store';
import { industryService } from '~/services/industry.service';
import type { Industry } from '~/services/industry.service';
import { format, parseISO, isValid } from 'date-fns';

const SIZE_OPTIONS: { value: OrganizationSize; label: string }[] = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
];

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const orgSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.union([z.string().url(), z.literal('')]).optional(),
  industryId: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
});

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-sm font-medium text-foreground">{value ?? '—'}</p>
    </div>
  );
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'MMM d, yyyy') : '—';
  } catch {
    return '—';
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsHome =
    location.pathname === '/settings' || location.pathname === '/settings/';
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [userData, setUserData] = useState<Awaited<
    ReturnType<typeof getUserMe>
  > | null>(null);
  const [orgData, setOrgData] = useState<ApiOrganization | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [profileStatus, setProfileStatus] = useState<SaveStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
  });

  const [passwordStatus, setPasswordStatus] = useState<SaveStatus>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [orgStatus, setOrgStatus] = useState<SaveStatus>('idle');
  const [orgErrorMsg, setOrgErrorMsg] = useState<string | null>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    website: '',
    industryId: '',
    size: '' as OrganizationSize | '',
  });

  const [dangerOpen, setDangerOpen] = useState(false);
  const [dangerConfirmName, setDangerConfirmName] = useState('');
  const [dangerStatus, setDangerStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle'
  );
  const [dangerError, setDangerError] = useState<string | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessAfterDelay = useCallback(
    (setter: (s: SaveStatus) => void) => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setter('idle'), 3000);
    },
    []
  );

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setUserLoading(true);
    setUserError(null);
    getUserMe()
      .then((data) => {
        if (!cancelled) {
          setUserData(data);
          setProfileForm({
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
          });
        }
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setUserError(e?.message ?? 'Failed to load user');
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancelled = false;
    setOrgLoading(true);
    setOrgError(null);
    Promise.all([getOrganizationMe(), industryService.list()])
      .then(([org, ind]) => {
        if (!cancelled) {
          setOrgData(org);
          setIndustries(ind);
          setOrgForm({
            name: org.name,
            website: org.website ?? '',
            industryId: org.industryId ?? org.industry?.id ?? '',
            size: (org.size as OrganizationSize) ?? '',
          });
        }
      })
      .catch((e: { message?: string }) => {
        if (!cancelled)
          setOrgError(e?.message ?? 'Failed to load organization');
      })
      .finally(() => {
        if (!cancelled) setOrgLoading(false);
      });
  }, []);

  const handleProfileSave = async () => {
    const parsed = profileSchema.safeParse(profileForm);
    if (!parsed.success) {
      setProfileError(parsed.error.errors[0]?.message ?? 'Validation failed');
      return;
    }
    setProfileStatus('saving');
    setProfileError(null);
    try {
      await updateUserMe({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      });
      setProfileStatus('success');
      const updated = await getUserMe();
      setUserData(updated);
      setProfileForm({
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
      });
      clearSuccessAfterDelay(setProfileStatus);
    } catch (e: unknown) {
      setProfileStatus('error');
      setProfileError((e as { message?: string })?.message ?? 'Failed to save');
    }
  };

  const handlePasswordSave = async () => {
    const parsed = passwordSchema.safeParse(passwordForm);
    if (!parsed.success) {
      setPasswordError(parsed.error.errors[0]?.message ?? 'Validation failed');
      return;
    }
    setPasswordStatus('saving');
    setPasswordError(null);
    try {
      await updateUserMe({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      setPasswordStatus('success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      clearSuccessAfterDelay(setPasswordStatus);
    } catch (e: unknown) {
      setPasswordStatus('error');
      setPasswordError(
        (e as { message?: string })?.message ?? 'Failed to save'
      );
    }
  };

  const handleOrgSave = async () => {
    const parsed = orgSchema.safeParse({
      ...orgForm,
      website: orgForm.website || undefined,
    });
    if (!parsed.success) {
      setOrgErrorMsg(parsed.error.errors[0]?.message ?? 'Validation failed');
      return;
    }
    setOrgStatus('saving');
    setOrgErrorMsg(null);
    try {
      await updateOrganizationMe({
        name: parsed.data.name,
        website: parsed.data.website || undefined,
        industryId: parsed.data.industryId || undefined,
        size: parsed.data.size,
      });
      setOrgStatus('success');
      const updated = await getOrganizationMe();
      setOrgData(updated);
      setOrgForm({
        name: updated.name,
        website: updated.website ?? '',
        industryId: updated.industryId ?? updated.industry?.id ?? '',
        size: (updated.size as OrganizationSize) ?? '',
      });
      clearSuccessAfterDelay(setOrgStatus);
    } catch (e: unknown) {
      setOrgStatus('error');
      setOrgErrorMsg((e as { message?: string })?.message ?? 'Failed to save');
    }
  };

  const handleDeactivateConfirm = async () => {
    if (dangerConfirmName !== orgData?.name) return;
    setDangerStatus('saving');
    setDangerError(null);
    try {
      await updateOrganizationMe({ isActive: false });
      await authService.logout();
      clearAuth();
      navigate('/login');
    } catch (e: unknown) {
      setDangerStatus('error');
      setDangerError(
        (e as { message?: string })?.message ?? 'Failed to deactivate'
      );
    }
  };

  const canDeactivate = dangerConfirmName === orgData?.name;

  return (
    <>
      {isSettingsHome ? (
        <>
          {portalReady && headerPortal.current
            ? createPortal(
                <div className="flex w-full items-center justify-between">
                  <h1 className="text-lg font-bold text-foreground">Settings</h1>
                </div>,
                headerPortal.current
              )
            : null}

          <div className="mx-auto w-full px-4 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your account and organization settings
          </p>
        </div>

        <Tabs defaultValue="account">
          <TabsList className="mb-4 h-9">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            {isAdmin && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
          </TabsList>

          <TabsContent value="account">
            {userError ? (
              <p className="mb-3 text-sm text-destructive" role="alert">
                {userError}
              </p>
            ) : null}
            {userLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="p-4 pb-2 space-y-0.5">
                    <CardTitle className="text-base">Profile</CardTitle>
                    <CardDescription className="text-xs">
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <FieldGroup className="gap-3">
                      <Field>
                        <FieldLabel htmlFor="firstName">First name</FieldLabel>
                        <Input
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="First name"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                        <Input
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="Last name"
                        />
                      </Field>
                    </FieldGroup>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleProfileSave}
                        disabled={profileStatus === 'saving'}
                      >
                        {profileStatus === 'saving' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save
                      </Button>
                      {profileStatus === 'success' ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Saved successfully
                        </span>
                      ) : null}
                      {profileStatus === 'error' && profileError ? (
                        <span className="text-sm text-destructive" role="alert">
                          {profileError}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2 space-y-0.5">
                    <CardTitle className="text-base">Password</CardTitle>
                    <CardDescription className="text-xs">
                      Change your account password
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <FieldGroup className="gap-3">
                      <Field>
                        <FieldLabel htmlFor="currentPassword">
                          Current password
                        </FieldLabel>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((f) => ({
                              ...f,
                              currentPassword: e.target.value,
                            }))
                          }
                          placeholder="Current password"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="newPassword">
                          New password
                        </FieldLabel>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((f) => ({
                              ...f,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="New password (min 8 characters)"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="confirmPassword">
                          Confirm password
                        </FieldLabel>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((f) => ({
                              ...f,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Confirm new password"
                        />
                      </Field>
                    </FieldGroup>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handlePasswordSave}
                        disabled={passwordStatus === 'saving'}
                      >
                        {passwordStatus === 'saving' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save
                      </Button>
                      {passwordStatus === 'success' ? (
                        <span className="flex items-center gap-1.5 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Saved successfully
                        </span>
                      ) : null}
                      {passwordStatus === 'error' && passwordError ? (
                        <span className="text-sm text-destructive" role="alert">
                          {passwordError}
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="organization">
            {orgError ? (
              <p className="mb-3 text-sm text-destructive" role="alert">
                {orgError}
              </p>
            ) : null}
            {orgLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : orgData ? (
              <>
              <Card>
                <CardHeader className="p-4 pb-2 space-y-0.5">
                  <CardTitle className="text-base">Organization</CardTitle>
                  <CardDescription className="text-xs">
                    {isAdmin
                      ? 'Manage your organization details'
                      : 'View your organization details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {isAdmin ? (
                    <>
                      <FieldGroup className="gap-3">
                        <Field>
                          <FieldLabel htmlFor="orgName">Name</FieldLabel>
                          <Input
                            id="orgName"
                            value={orgForm.name}
                            onChange={(e) =>
                              setOrgForm((f) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Organization name"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="orgWebsite">Website</FieldLabel>
                          <Input
                            id="orgWebsite"
                            type="url"
                            value={orgForm.website}
                            onChange={(e) =>
                              setOrgForm((f) => ({
                                ...f,
                                website: e.target.value,
                              }))
                            }
                            placeholder="https://example.com"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="orgIndustry">
                            Industry
                          </FieldLabel>
                          <Select
                            value={orgForm.industryId || undefined}
                            onValueChange={(v) =>
                              setOrgForm((f) => ({ ...f, industryId: v }))
                            }
                          >
                            <SelectTrigger id="orgIndustry">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {industries.map((i) => (
                                <SelectItem key={i.id} value={i.id}>
                                  {i.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="orgSize">Size</FieldLabel>
                          <Select
                            value={orgForm.size || undefined}
                            onValueChange={(v) =>
                              setOrgForm((f) => ({
                                ...f,
                                size: v as OrganizationSize,
                              }))
                            }
                          >
                            <SelectTrigger id="orgSize">
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {SIZE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="orgSlug">Slug</FieldLabel>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="orgSlug"
                              value={orgData.slug}
                              disabled
                              className="pl-9"
                            />
                          </div>
                        </Field>
                      </FieldGroup>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleOrgSave}
                          disabled={orgStatus === 'saving'}
                        >
                          {orgStatus === 'saving' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Save
                        </Button>
                        {orgStatus === 'success' ? (
                          <span className="flex items-center gap-1.5 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Saved successfully
                          </span>
                        ) : null}
                        {orgStatus === 'error' && orgErrorMsg ? (
                          <span
                            className="text-sm text-destructive"
                            role="alert"
                          >
                            {orgErrorMsg}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t pt-3 mt-3">
                        <Badge variant="secondary">Self-hosted · Free</Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {formatDate(orgData.createdAt)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoField
                        label="Name"
                        value={orgData.name}
                        icon={Building2}
                      />
                      <InfoField
                        label="Website"
                        value={orgData.website}
                        icon={Globe}
                      />
                      <InfoField
                        label="Industry"
                        value={orgData.industry?.name}
                        icon={Shield}
                      />
                      <InfoField
                        label="Size"
                        value={orgData.size}
                        icon={Building2}
                      />
                      <InfoField
                        label="Slug"
                        value={orgData.slug}
                        icon={Lock}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {isAdmin ? (
                <Card className="mt-4">
                  <CardHeader className="p-4 pb-2 space-y-0.5">
                    <CardTitle className="text-base">Branding</CardTitle>
                    <CardDescription className="text-xs">
                      Logo and colors for your workspace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/settings/branding">
                        <Palette className="mr-2 h-4 w-4" />
                        Edit branding
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
              </>
            ) : null}
          </TabsContent>

          {isAdmin ? (
            <TabsContent value="danger">
              <Card className="border-destructive">
                <CardHeader className="p-4 pb-2 space-y-0.5">
                  <CardTitle className="text-base text-destructive">
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Irreversible actions that affect your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Deactivate organization
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Disables access for all users
                    </p>
                    <Button
                      variant="destructive"
                      className="mt-1.5"
                      size="sm"
                      onClick={() => setDangerOpen(true)}
                    >
                      Deactivate organization
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <AlertDialog open={dangerOpen} onOpenChange={setDangerOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate organization</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disable access for all users. You will be logged
                      out immediately. Type the organization name{' '}
                      <strong className="text-foreground">
                        {orgData?.name}
                      </strong>{' '}
                      to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 py-2">
                    <FieldLabel htmlFor="confirmName">
                      Organization name
                    </FieldLabel>
                    <Input
                      id="confirmName"
                      value={dangerConfirmName}
                      onChange={(e) => setDangerConfirmName(e.target.value)}
                      placeholder="Type organization name"
                      className="font-mono"
                    />
                  </div>
                  {dangerError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {dangerError}
                    </p>
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setDangerConfirmName('');
                        setDangerError(null);
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      disabled={!canDeactivate || dangerStatus === 'saving'}
                      onClick={handleDeactivateConfirm}
                    >
                      {dangerStatus === 'saving' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Deactivate
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
        </>
      ) : (
        <Outlet />
      )}
    </>
  );
}
