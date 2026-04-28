import { useState } from 'react';
import './Profile.css';

// ── Inline SVG icons (no extra deps, matches Dashboard icon style) ──
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="5" y="11" width="14" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={13} height={13}>
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Gravatar URL generator ──
function getGravatarUrl(email) {
  const trimmed = email.trim().toLowerCase();
  const hash = [...trimmed].reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0).toString(16);
  return `https://i.pravatar.cc/120?u=${encodeURIComponent(email)}`;
}

export function Profile() {
  const [profile, setProfile] = useState({
    fullName: 'Juan dela Cruz',
    email: 'juan@cit.edu',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const [editMode, setEditMode]           = useState(false);
  const [savedProfile, setSavedProfile]   = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [savedPassword, setSavedPassword]   = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError]   = useState('');
  const [avatarError, setAvatarError]       = useState(false);

  const initials = profile.fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleProfileSave = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      setSavedProfile(true);
      setEditMode(false);
      setTimeout(() => setSavedProfile(false), 3000);
    }, 900);
  };

  const handlePasswordSave = () => {
    setPasswordError('');
    if (!passwords.current)           return setPasswordError('Please enter your current password.');
    if (passwords.newPass.length < 8) return setPasswordError('New password must be at least 8 characters.');
    if (passwords.newPass !== passwords.confirm) return setPasswordError('Passwords do not match.');

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setSavedPassword(true);
      setPasswords({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setSavedPassword(false), 3000);
    }, 900);
  };

  const gravatarUrl = getGravatarUrl(profile.email);

  return (
    <div className="pf-container">
      <div className="pf-wrapper">

        {/* ── Profile Header Card ── */}
        <div className="pf-card">
          <div className="pf-avatar-section">
            {!avatarError ? (
              <img 
                src={gravatarUrl}
                alt={profile.fullName}
                className="pf-avatar-img"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="pf-avatar">{initials}</div>
            )}
            <div className="pf-avatar-info">
              <p className="pf-avatar-name">{profile.fullName}</p>
              <p className="pf-avatar-email">{profile.email}</p>
              <span className="pf-member-badge">Student</span>
            </div>
          </div>

          {/* Edit Name & Email */}
          <div className="pf-card-body">
            <div className="pf-form-row">
              <div className="pf-field">
                <label className="pf-label">Full Name</label>
                <input
                  className="pf-input"
                  value={profile.fullName}
                  disabled={!editMode}
                  onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Email Address</label>
                <input
                  className="pf-input"
                  type="email"
                  value={profile.email}
                  disabled={!editMode}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div className="pf-card-footer">
            {savedProfile && (
              <span className="pf-status-text"><IconCheck /> Profile updated successfully</span>
            )}
            {!editMode ? (
              <button className="pf-btn-primary pf-btn-small" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            ) : (
              <>
                <button className="pf-btn-secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
                <button className="pf-btn-primary" onClick={handleProfileSave} disabled={savingProfile}>
                  {savingProfile
                    ? <><span className="pf-loader" /> Saving...</>
                    : <><IconCheck /> Save Changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="pf-card">
          <div className="pf-card-header">
            <p className="pf-card-title">
              <IconLock /> Change Password
            </p>
          </div>

          <div className="pf-card-body">
            <div className="pf-field">
              <label className="pf-label">Current Password</label>
              <input
                className="pf-input"
                type="password"
                placeholder="Enter current password"
                value={passwords.current}
                onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
              />
            </div>
            <div className="pf-form-row">
              <div className="pf-field">
                <label className="pf-label">New Password</label>
                <input
                  className="pf-input"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={passwords.newPass}
                  onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Confirm New Password</label>
                <input
                  className="pf-input"
                  type="password"
                  placeholder="Repeat new password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>
            </div>
            {passwordError && <p className="pf-error">{passwordError}</p>}
          </div>

          <div className="pf-card-footer">
            {savedPassword && (
              <span className="pf-status-text"><IconCheck /> Password changed successfully</span>
            )}
            <button className="pf-btn-primary pf-btn-small" onClick={handlePasswordSave} disabled={savingPassword}>
              {savingPassword
                ? <><span className="pf-loader" /> Updating...</>
                : <> Update Password</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;