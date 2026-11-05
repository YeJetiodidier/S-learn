import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginWithGoogle, loginWithFacebook, mapAuthError } from "../firebase/authService";
import "../auth.css"; // Using new styling

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
    setSuccess("");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    try {
      await loginWithGoogle();
      setSuccess("Account linked! Redirecting...");
      setTimeout(() => navigate("/loading"), 1000);
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  const handleFacebookSignIn = async () => {
    setError("");
    setSuccess("");
    try {
      await loginWithFacebook();
      setSuccess("Facebook account linked! Redirecting...");
      setTimeout(() => navigate("/loading"), 1000);
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await registerUser(formData.name, formData.email, formData.password);
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(mapAuthError(err));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div className="auth-avatar">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12A5 5 0 1 0 7 7a5.006 5.006 0 0 0 5 5zm0-8a3 3 0 1 1-3 3 3.003 3.003 0 0 1 3-3zm7 17H5a1 1 0 0 1-1-1v-2a5.006 5.006 0 0 1 5-5h6a5.006 5.006 0 0 1 5 5v2a1 1 0 0 1-1 1zm-13-2h12v-1a3.003 3.003 0 0 0-3-3H9a3.003 3.003 0 0 0-3 3z" />
          </svg>
        </div>

        <h1 className="auth-title">Create Account</h1>

        <form className="auth-form" onSubmit={handleSubmit}>

          <div className="auth-input-group">
            <div className="auth-labels">
              <span className="auth-label">Full Name</span>
            </div>
            <div className="auth-input-wrapper">
              <div className="auth-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="auth-separator"></div>
              <input
                className="auth-input"
                type="text"
                name="name"
                placeholder="Enter your full name"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-labels">
              <span className="auth-label">Email</span>
            </div>
            <div className="auth-input-wrapper">
              <div className="auth-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="auth-separator"></div>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-labels">
              <span className="auth-label">Password</span>
            </div>
            <div className="auth-input-wrapper auth-password-wrapper">
              <div className="auth-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="auth-separator"></div>
              <input
                className="auth-input auth-password-input"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {showPassword ? (
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

          <button type="submit" className="auth-btn">Register</button>

        </form>

        {error && <div className="auth-alert-error">{error}</div>}
        {success && <div className="auth-alert-success">{success}</div>}

        <div className="auth-divider">or continue with</div>

        <div className="auth-socials">
          <button className="auth-social-btn" type="button" style={{color: '#ea4335'}} onClick={handleGoogleSignIn}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#EA4335" d="M23.49 12.275c0-.812-.073-1.593-.207-2.35H12v4.444h6.444a5.526 5.526 0 0 1-2.395 3.626v3.013h3.878c2.268-2.091 3.563-5.176 3.563-8.733z"/>
              <path fill="#34A853" d="M12 24c3.235 0 5.95-1.077 7.933-2.914l-3.878-3.013c-1.074.722-2.453 1.15-4.055 1.15-3.118 0-5.759-2.106-6.697-4.94h-4.008v3.1A11.96 11.96 0 0 0 12 24z"/>
              <path fill="#4A90E2" d="M5.303 14.283A7.16 7.16 0 0 1 4.92 12c0-.792.138-1.56.383-2.283V6.617H1.295A11.956 11.956 0 0 0 0 12c0 1.936.46 3.766 1.295 5.383l4.008-3.1z"/>
              <path fill="#FBBC05" d="M12 4.773c1.761 0 3.342.607 4.587 1.796l3.447-3.447C17.944 1.18 15.228 0 12 0 7.373 0 3.328 2.653 1.295 6.617l4.008 3.1c.938-2.834 3.58-4.944 6.697-4.944z"/>
            </svg>
          </button>
          <button className="auth-social-btn" type="button" style={{color: '#1877f2'}} onClick={handleFacebookSignIn}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.249h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Login &rsaquo;</Link>
        </div>

      </div>

    </div>
  );
}

export default Register;
