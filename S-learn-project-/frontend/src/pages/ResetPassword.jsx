import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { confirmResetPassword, mapAuthError } from "../firebase/authService";
import "../auth.css";

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const oobCode = query.get("oobCode");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!oobCode) {
            setError("Missing reset code. Please use the link from your email.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        try {
            await confirmResetPassword(oobCode, newPassword);
            setMessage("Password reset successful! Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(mapAuthError(err));
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Reset Password</h1>
                {message && <div className="auth-alert-success">{message}</div>}
                {error && <div className="auth-alert-danger" style={{ color: "red", margin: "1rem 0" }}>{error}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <div className="auth-labels">
                            <span className="auth-label">New Password</span>
                        </div>
                        <div className="auth-input-wrapper auth-password-wrapper">
                            <input
                                className="auth-input auth-password-input"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-label={showNewPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowNewPassword((value) => !value)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    {showNewPassword ? (
                                        <path d="M12 5c-5.5 0-10 4.5-10 7s4.5 7 10 7 10-4.5 10-7-4.5-7-10-7zm0 11.5A4.5 4.5 0 1 1 12 7a4.5 4.5 0 0 1 0 9.5zm0-7.5A3 3 0 1 0 12 15a3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 12 10.5z" />
                                    ) : (
                                        <>
                                            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M10.5 10.5A2.5 2.5 0 0 0 13.5 13.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M9.12 5.7A10.7 10.7 0 0 1 12 5c5.5 0 10 4.5 10 7a13.5 13.5 0 0 1-4.65 5.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6.7 6.7A13.4 13.4 0 0 0 2 12c0 2.5 4.5 7 10 7 2.2 0 4.1-.7 5.6-1.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="auth-input-group">
                        <div className="auth-labels">
                            <span className="auth-label">Confirm Password</span>
                        </div>
                        <div className="auth-input-wrapper auth-password-wrapper">
                            <input
                                className="auth-input auth-password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowConfirmPassword((value) => !value)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    {showConfirmPassword ? (
                                        <path d="M12 5c-5.5 0-10 4.5-10 7s4.5 7 10 7 10-4.5 10-7-4.5-7-10-7zm0 11.5A4.5 4.5 0 1 1 12 7a4.5 4.5 0 0 1 0 9.5zm0-7.5A3 3 0 1 0 12 15a3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 12 10.5z" />
                                    ) : (
                                        <>
                                            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M10.5 10.5A2.5 2.5 0 0 0 13.5 13.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M9.12 5.7A10.7 10.7 0 0 1 12 5c5.5 0 10 4.5 10 7a13.5 13.5 0 0 1-4.65 5.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6.7 6.7A13.4 13.4 0 0 0 2 12c0 2.5 4.5 7 10 7 2.2 0 4.1-.7 5.6-1.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="auth-btn">Reset Password</button>
                </form>
                <div className="auth-footer">
                    <Link to="/login" className="auth-link">Back to Login &rsaquo;</Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
