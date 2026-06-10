"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, LinkButton, PageHeader, PageShell } from "@/components/ui";
import { changePassword, updateCurrentUser, type AuthUser } from "@/lib/auth";

type AccountForm = {
  displayName: string;
  email: string;
  countryDialCode: string;
  phoneNumber: string;
  marketingOptIn: boolean;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

const initialPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  newPasswordConfirm: ""
};

const inputClass = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function AccountSettingsPage() {
  const auth = useRequiredAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!auth.user || currentUser) {
      return;
    }
    setCurrentUser(auth.user);
    setAccountForm(toAccountForm(auth.user));
  }, [auth.user, currentUser]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="계정 설정 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="계정 설정은 로그인 후 이용할 수 있습니다." />;
  }

  if (!accountForm || !currentUser) {
    return <AuthCheckingScreen title="계정 정보를 준비하는 중입니다." />;
  }

  async function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountForm) {
      return;
    }
    setSavingAccount(true);
    setAccountError(null);
    setAccountMessage(null);

    try {
      const updatedUser = await updateCurrentUser({
        display_name: accountForm.displayName,
        email: accountForm.email,
        country_dial_code: accountForm.countryDialCode,
        phone_number: accountForm.phoneNumber,
        marketing_opt_in: accountForm.marketingOptIn
      });
      setCurrentUser(updatedUser);
      setAccountForm(toAccountForm(updatedUser));
      setAccountMessage("계정 정보가 저장되었습니다.");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "계정 정보 저장에 실패했습니다.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordMessage(null);

    try {
      const updatedUser = await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        new_password_confirm: passwordForm.newPasswordConfirm
      });
      setCurrentUser(updatedUser);
      setPasswordForm(initialPasswordForm);
      setPasswordMessage("비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setSavingPassword(false);
    }
  }

  const passwordReady = passwordForm.currentPassword && passwordForm.newPassword && passwordForm.newPasswordConfirm;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ACCOUNT SETTINGS"
        title="계정 설정"
        actions={<LinkButton href="/mypage" variant="secondary">마이페이지로</LinkButton>}
      />

      <section className="lens-container py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="rounded-3xl p-6">
              <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Profile Account</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">기본 계정 정보</h2>
                </div>
                <Badge tone={currentUser.email_verified ? "success" : "warning"}>
                  {currentUser.email_verified ? "이메일 확인됨" : "이메일 확인 필요"}
                </Badge>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleAccountSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="이름">
                    <input
                      className={inputClass}
                      value={accountForm.displayName}
                      onChange={(event) => setAccountForm({ ...accountForm, displayName: event.target.value })}
                    />
                  </Field>
                  <Field label="이메일">
                    <input
                      className={inputClass}
                      type="email"
                      value={accountForm.email}
                      onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })}
                    />
                  </Field>
                  <Field label="국가번호">
                    <select
                      className={inputClass}
                      value={accountForm.countryDialCode}
                      onChange={(event) => setAccountForm({ ...accountForm, countryDialCode: event.target.value })}
                    >
                      <option value="+82">대한민국 +82</option>
                      <option value="+1">미국/캐나다 +1</option>
                      <option value="+81">일본 +81</option>
                      <option value="+44">영국 +44</option>
                      <option value="+49">독일 +49</option>
                      <option value="">선택 안 함</option>
                    </select>
                  </Field>
                  <Field label="휴대폰">
                    <input
                      className={inputClass}
                      value={accountForm.phoneNumber}
                      placeholder="01012345678"
                      onChange={(event) => setAccountForm({ ...accountForm, phoneNumber: event.target.value })}
                    />
                  </Field>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={accountForm.marketingOptIn}
                    onChange={(event) => setAccountForm({ ...accountForm, marketingOptIn: event.target.checked })}
                  />
                  <span>서비스 개선 안내와 발표용 피드백 수신에 동의합니다.</span>
                </label>

                <StatusMessage message={accountMessage} error={accountError} />

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingAccount}>
                    {savingAccount ? "저장 중" : "계정 정보 저장"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="rounded-3xl p-6">
              <div className="border-b border-line pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Password</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">비밀번호 변경</h2>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handlePasswordSubmit}>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="현재 비밀번호">
                    <input
                      className={inputClass}
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                    />
                  </Field>
                  <Field label="새 비밀번호">
                    <input
                      className={inputClass}
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                    />
                  </Field>
                  <Field label="새 비밀번호 확인">
                    <input
                      className={inputClass}
                      type="password"
                      value={passwordForm.newPasswordConfirm}
                      onChange={(event) => setPasswordForm({ ...passwordForm, newPasswordConfirm: event.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid gap-2 rounded-2xl border border-line bg-paper p-4 text-xs text-slate-600 sm:grid-cols-3">
                  <span>8자 이상</span>
                  <span>영문 포함</span>
                  <span>숫자와 특수문자 포함</span>
                </div>

                <StatusMessage message={passwordMessage} error={passwordError} />

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingPassword || !passwordReady}>
                    {savingPassword ? "변경 중" : "비밀번호 변경"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="rounded-3xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">Account Summary</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">{currentUser.display_name}</h2>
              <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
              <div className="mt-5 grid gap-3">
                <SummaryRow label="아이디" value={currentUser.login_id} />
                <SummaryRow label="권한" value={currentUser.admin ? "관리자" : "일반 사용자"} />
                <SummaryRow label="프로필" value={currentUser.profile_completed ? "저장 완료" : "입력 필요"} />
                <SummaryRow label="계정 상태" value={currentUser.account_status ?? "ACTIVE"} />
              </div>
            </Card>

            <Card className="rounded-3xl bg-night p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mint">Security Note</p>
              <h2 className="mt-2 text-xl font-semibold">계정 변경 후 확인할 것</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
                <p>이메일을 변경하면 이메일 확인 상태가 초기화됩니다.</p>
                <p>비밀번호 변경 후에도 현재 로그인 세션은 유지됩니다.</p>
                <p>관리자 권한과 결제 멤버십은 별도 정책으로 관리됩니다.</p>
              </div>
            </Card>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function toAccountForm(user: AuthUser): AccountForm {
  return {
    displayName: user.display_name ?? "",
    email: user.email ?? "",
    countryDialCode: user.country_dial_code ?? "+82",
    phoneNumber: user.phone_number ?? "",
    marketingOptIn: Boolean(user.marketing_opt_in)
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function StatusMessage({ message, error }: { message: string | null; error: string | null }) {
  if (!message && !error) {
    return null;
  }
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`} role="alert">
      {error ?? message}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
