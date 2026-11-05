import { useState } from "react";
import { Link } from "react-router-dom";
import { sendResetEmail, mapAuthError } from "../firebase/authService";
import "../auth.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!email.trim() || !email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            await sendResetEmail(email);
            setMessage("Reset link sent to your email. Please check your inbox.");
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Password Recovery</h1>
                {message && <div className="auth-alert-success">{message}</div>}
                {error && <div className="auth-alert-danger" style={{ color: "red", margin: "1rem 0" }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <div className="auth-labels">
                            <span className="auth-label">Email</span>
                        </div>
                        <div className="auth-input-wrapper">
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="Enter your account email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Email"}
                    </button>
                </form>

                <div className="auth-footer">
                    Remembered it? <Link to="/login" className="auth-link">Back to Login &rsaquo;</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
