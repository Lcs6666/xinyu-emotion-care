"use client";

import { FormEvent, useState } from "react";

type Mode = "login" | "register" | "recover";

export default function LoginPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recovery, setRecovery] = useState("");
  const [issuedRecovery, setIssuedRecovery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => { setMode(next); setError(""); setPassword(""); setConfirmPassword(""); setRecovery(""); };
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if ((mode === "register" || mode === "recover") && password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
    setBusy(true);
    const endpoint = mode === "register" ? "/api/auth/register" : mode === "recover" ? "/api/auth/recover" : "/api/auth/login";
    const payload = mode === "recover" ? { username, recoveryCode: recovery, newPassword: password } : { username, password };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({})) as { error?: string; recoveryCode?: string };
      if (!response.ok) { setError(data.error || "服务暂时不可用，请稍后重试"); return; }
      if (data.recoveryCode) { setIssuedRecovery(data.recoveryCode); return; }
      window.location.reload();
    } catch {
      setError("网络连接异常，请检查网络后重试");
    } finally {
      setBusy(false);
    }
  }

  if (issuedRecovery) return <main className="login-page"><section className="login-card recovery-card"><div className="login-logo">✓</div><p className="eyebrow">账号已准备好</p><h1>请保存你的恢复码</h1><p className="login-copy">它是忘记密码后找回账号的唯一方式。我们无法替你恢复或重新发送。</p><div className="recovery-code">{issuedRecovery}</div><button className="copy-code" onClick={() => void navigator.clipboard.writeText(issuedRecovery)}>复制恢复码</button><button className="primary-button" onClick={() => window.location.reload()}>我已保存，进入心屿</button><p className="privacy-note">请勿把恢复码发给任何人。</p></section></main>;

  return <main className="login-page"><section className="login-card"><div className="login-logo">♡</div><p className="eyebrow">心屿 · 匿名情绪日记</p><h1>给情绪一座安静的小岛</h1><p className="login-copy">无需手机号、邮箱或真实姓名。创建一个只属于你的匿名账号，记录会与其他用户完全分开。</p><div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>登录</button><button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>创建账号</button></div><form className="login-form" onSubmit={submit}><label>匿名账号名<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="3–24 位，不需要真实姓名" autoComplete="username" required minLength={3} maxLength={24} /></label>{mode === "recover" && <label>恢复码<input value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autoCapitalize="characters" required /></label>}<label>{mode === "recover" ? "设置新密码" : "密码"}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 位" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} /></label>{mode !== "login" && <label>确认密码<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" autoComplete="new-password" required /></label>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "请稍候…" : mode === "login" ? "登录心屿" : mode === "register" ? "创建匿名账号" : "重设密码"}</button></form>{mode === "login" ? <button className="text-button" onClick={() => switchMode("recover")}>忘记密码？使用恢复码</button> : <button className="text-button" onClick={() => switchMode("login")}>已有账号，返回登录</button>}<p className="privacy-note">密码会经过加盐哈希后保存；请勿使用你在其他网站的常用密码。</p></section></main>;
}
