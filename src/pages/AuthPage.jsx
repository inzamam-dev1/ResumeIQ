import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { S, FONTS } from "../styles.js";

// ─── Auth Page (Login / Signup / Forgot Password) ─────────────────────────────
export default function AuthPage({ onSuccess, onBack }) {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode]         = useState("login"); // login | signup | forgot
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const Spinner = () => (
    <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.4)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
  );

  // ── Friendly Firebase error messages ────────────────────────────────────────
  function friendlyError(code) {
    const map = {
      "auth/invalid-email":            "Please enter a valid email address.",
      "auth/user-not-found":           "No account found with this email.",
      "auth/wrong-password":           "Incorrect password. Try again.",
      "auth/email-already-in-use":     "An account with this email already exists.",
      "auth/weak-password":            "Password must be at least 6 characters.",
      "auth/too-many-requests":        "Too many attempts. Please wait a moment.",
      "auth/popup-closed-by-user":     "Google sign-in was cancelled.",
      "auth/network-request-failed":   "Network error. Check your connection.",
      "auth/invalid-credential":       "Invalid email or password.",
    };
    return map[code] || "Something went wrong. Please try again.";
  }

  const handleSubmit = async () => {
    setError(""); setMessage(""); setLoading(true);

    try {
      if (mode === "forgot") {
        if (!email) { setError("Please enter your email."); setLoading(false); return; }
        await resetPassword(email);
        setMessage("Password reset email sent! Check your inbox.");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        if (!name.trim())           { setError("Please enter your name.");                setLoading(false); return; }
        if (!email)                 { setError("Please enter your email.");               setLoading(false); return; }
        if (password.length < 6)    { setError("Password must be at least 6 characters."); setLoading(false); return; }
        if (password !== confirm)   { setError("Passwords do not match.");                setLoading(false); return; }
        await signup(email, password, name.trim());
      } else {
        if (!email || !password)    { setError("Please fill all fields."); setLoading(false); return; }
        await login(email, password);
      }

      onSuccess?.();
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
  };

  return (
    <div style={{ ...S.root, display: "flex", alignItems: "flex-start", justifyContent: "center", minHeight: "100vh", padding: "20px 16px", paddingTop: "env(safe-area-inset-top, 20px)" }}>
      <style>{`${FONTS} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, #00D9A312, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ ...S.card, width: "100%", maxWidth: 420, position: "relative", zIndex: 1, margin: "20px" }}>

        {/* Logo */}
        <div onClick={onBack} style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, background: "linear-gradient(135deg,#00D9A3,#0284c7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 28, cursor: "pointer", display: "inline-block" }}>
          ResumeIQ
        </div>

        {/* Title */}
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          {mode === "login"  ? "Welcome back"     :
           mode === "signup" ? "Create account"   :
                               "Reset password"}
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 26 }}>
          {mode === "login"  ? "Sign in to your workspace"     :
           mode === "signup" ? "Free — no credit card required" :
                               "We'll send you a reset link"}
        </p>

        {/* Error / Success messages */}
        {error   && <div style={{ background: "#EF444418", border: "1px solid #EF444440", color: "#EF4444", padding: "11px 14px", borderRadius: 9, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        {message && <div style={{ background: "#00D9A318", border: "1px solid #00D9A340", color: "#00D9A3", padding: "11px 14px", borderRadius: 9, marginBottom: 16, fontSize: 13 }}>{message}</div>}

        {/* Google button */}
        {mode !== "forgot" && (
          <>
            <button onClick={handleGoogle} disabled={loading}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1px solid #1e293b", background: "#0f172a", color: "#f1f5f9", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18, transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#334155"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}>
              {/* Google icon */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
              <span style={{ color: "#475569", fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            </div>
          </>
        )}

        {/* Form fields */}
        {mode === "signup" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>FULL NAME</label>
            <input style={{ ...S.inp }} placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>EMAIL</label>
          <input style={{ ...S.inp }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {mode !== "forgot" && (
          <div style={{ marginBottom: mode === "signup" ? 12 : 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...S.inp, paddingRight: 44 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>CONFIRM PASSWORD</label>
            <input style={{ ...S.inp }} type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
        )}

        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <span onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} style={{ color: "#64748b", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Forgot password?
            </span>
          </div>
        )}

        {mode !== "login" && <div style={{ marginBottom: 20 }} />}

        {/* Submit button */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ ...S.btn(), width: "100%", padding: 13, fontSize: 15, opacity: loading ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading && <Spinner />}
          {!loading && (mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link")}
          {loading  && (mode === "login" ? "Signing in…" : mode === "signup" ? "Creating account…" : "Sending…")}
        </button>

        {/* Switch mode */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#64748b" }}>
          {mode === "login" && <>
            Don't have an account?{" "}
            <span onClick={() => { setMode("signup"); setError(""); setMessage(""); }} style={{ color: "#00D9A3", cursor: "pointer", fontWeight: 600 }}>Sign up free</span>
          </>}
          {mode === "signup" && <>
            Already have an account?{" "}
            <span onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={{ color: "#00D9A3", cursor: "pointer", fontWeight: 600 }}>Sign in</span>
          </>}
          {mode === "forgot" && <>
            Remember it?{" "}
            <span onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={{ color: "#00D9A3", cursor: "pointer", fontWeight: 600 }}>Back to login</span>
          </>}
        </div>

        {/* Terms */}
        {mode === "signup" && (
          <p style={{ color: "#475569", fontSize: 11, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
            By creating an account you agree to our{" "}
            <span style={{ color: "#64748b", textDecoration: "underline", cursor: "pointer" }}>Terms of Service</span> and{" "}
            <span style={{ color: "#64748b", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
          </p>
        )}
      </div>
    </div>
  );
}
