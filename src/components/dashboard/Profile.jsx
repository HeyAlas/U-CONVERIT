import { useState, useRef } from 'react';
import '../../styles/dashboard.css';

// ── Inline SVG icons ──
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

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Profile() {
  const [profile, setProfile] = useState({
    fullName: 'Juan dela Cruz',
    email: 'juan@cit.edu',
  });

  const [profilePic, setProfilePic] = useState(null); // null = show default icon
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [savedPassword, setSavedPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [picError, setPicError] = useState('');

  const fileInputRef = useRef(null);

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
    if (!passwords.current) return setPasswordError('Please enter your current password.');
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

  // Handle profile picture upload
  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPicError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPicError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPicError('Image must be less than 5MB.');
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePic = () => {
    setProfilePic(null);
    setPicError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
    }
  };

  return (
    <div className="pf-container">
      <div className="pf-wrapper">

        {/* ── Profile Header Card ── */}
        <div className="pf-card">
          <div className="pf-avatar-section">
            {/* Clickable Avatar */}
            <div className="pf-avatar-wrapper" onClick={triggerFileInput} title="Click to change photo">
              {profilePic ? (
                <img src={profilePic} alt={profile.fullName} className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-icon">
                  <IconUser />
                </div>
              )}
              <div className="pf-avatar-overlay">
                <IconCamera />
                <span>Change</span>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePicChange}
              style={{ display: 'none' }}
            />

            <div className="pf-avatar-info">
              <p className="pf-avatar-name">{profile.fullName}</p>
              <p className="pf-avatar-email">{profile.email}</p>
              <span className="pf-member-badge">Student</span>

              {/* Action buttons */}
              <div className="pf-avatar-actions">
                <button className="pf-pic-btn" onClick={triggerFileInput}>
                  <IconCamera /> Upload Photo
                </button>
                {profilePic && (
                  <button className="pf-pic-btn pf-pic-btn-danger" onClick={handleRemovePic}>
                    <IconTrash /> Remove
                  </button>
                )}
              </div>
              {picError && <p className="pf-error" style={{ marginTop: '0.5rem' }}>{picError}</p>}
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
                : <>Update Password</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;