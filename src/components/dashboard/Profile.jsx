import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

const IconLogOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: '',
    avatarUrl: null,
    createdAt: '',
  });

  const [stats, setStats] = useState({
    total_tools_used: 0,
    most_used_tool: 'None',
    tool_counts: {},
    total_quizzes: 0,
    avg_quiz_score: 0,
    best_quiz_score: 0,
    total_chars_processed: 0,
  });

  const [profilePic, setProfilePic] = useState(null);
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [picError, setPicError] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);

  const fileInputRef = useRef(null);

  // ── Fetch profile on mount ──
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${API_BASE}/api/profile/${user.id}`);
        const data = await res.json();

        if (data.success) {
          setProfile({
            fullName: data.profile.full_name || '',
            email: data.profile.email || '',
            role: data.profile.role || 'user',
            avatarUrl: data.profile.avatar_url || null,
            createdAt: data.profile.created_at || '',
          });
          setProfilePic(data.profile.avatar_url || null);
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  // ── Save profile changes ──
  const handleProfileSave = async () => {
    setSavingProfile(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      const formData = new FormData();
      formData.append('full_name', profile.fullName);

      const res = await fetch(`${API_BASE}/api/profile/${user.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setSavedProfile(true);
        setEditMode(false);
        setTimeout(() => setSavedProfile(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ──
  const handlePasswordSave = async () => {
    setPasswordError('');

    if (!passwords.current) return setPasswordError('Please enter your current password.');
    if (passwords.newPass.length < 8) return setPasswordError('New password must be at least 8 characters.');
    if (passwords.newPass !== passwords.confirm) return setPasswordError('Passwords do not match.');

    setSavingPassword(true);

    try {
      const { supabase } = await import('../../lib/supabase');

      const { error } = await supabase.auth.updateUser({
        password: passwords.newPass,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setSavedPassword(true);
        setPasswords({ current: '', newPass: '', confirm: '' });
        setTimeout(() => setSavedPassword(false), 3000);
      }
    } catch (err) {
      setPasswordError('Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Upload avatar ──
  const handlePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPicError('');

    if (!file.type.startsWith('image/')) {
      setPicError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPicError('Image must be less than 5MB.');
      return;
    }

    setUploadingPic(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/api/profile/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setProfilePic(data.avatar_url);
        setProfile(p => ({ ...p, avatarUrl: data.avatar_url }));
      } else {
        setPicError('Failed to upload avatar.');
      }
    } catch (err) {
      setPicError('Failed to upload avatar.');
    } finally {
      setUploadingPic(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleRemovePic = () => {
    setProfilePic(null);
    setPicError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Sign Out ──
  const handleSignOut = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // ── Format date helper ──
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="pf-container">
        <div className="pf-wrapper">
          <div className="pf-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="pf-loader" /> Loading profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-container">
      <div className="pf-wrapper">

        {/* ── Profile Header Card ── */}
        <div className="pf-card">
          <div className="pf-avatar-section">
            <div className="pf-avatar-wrapper" onClick={triggerFileInput} title="Click to change photo">
              {profilePic ? (
                <img src={profilePic} alt={profile.fullName} className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-icon">
                  <IconUser />
                </div>
              )}
              <div className="pf-avatar-overlay">
                {uploadingPic ? (
                  <span className="pf-loader" />
                ) : (
                  <>
                    <IconCamera />
                    <span>Change</span>
                  </>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePicChange}
              style={{ display: 'none' }}
            />

            <div className="pf-avatar-info">
              <p className="pf-avatar-name">{profile.fullName || 'No Name Set'}</p>
              <p className="pf-avatar-email">{profile.email}</p>
              <span className="pf-member-badge">
                {profile.role === 'admin' ? '👑 Admin' : '🎓 Student'}
              </span>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                Member since {formatDate(profile.createdAt)}
              </p>

              <div className="pf-avatar-actions">
                <button className="pf-pic-btn" onClick={triggerFileInput} disabled={uploadingPic}>
                  <IconCamera /> {uploadingPic ? 'Uploading...' : 'Upload Photo'}
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
                  disabled
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

        {/* ── Stats Card ── */}
        <div className="pf-card">
          <div className="pf-card-header">
            <p className="pf-card-title">📊 Your Activity</p>
          </div>
          <div className="pf-card-body">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  {stats.total_tools_used}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>Tools Used</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {stats.total_quizzes}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>Quizzes Taken</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {stats.avg_quiz_score}%
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>Avg Quiz Score</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {stats.total_chars_processed.toLocaleString()}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>Chars Processed</p>
              </div>
            </div>

            {Object.keys(stats.tool_counts).length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Tool Usage Breakdown:</p>
                {Object.entries(stats.tool_counts).map(([tool, count]) => (
                  <div key={tool} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '13px'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{tool.replace('_', ' ')}</span>
                    <span style={{ fontWeight: '600' }}>{count} uses</span>
                  </div>
                ))}
              </div>
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

        {/* ── Sign Out ── */}
        <div className="pf-card">
          <div className="pf-card-body" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>Sign Out</p>
              <p style={{ fontSize: '13px', color: '#666' }}>Log out of your account on this device</p>
            </div>
            <button
              className="pf-btn-secondary"
              onClick={handleSignOut}
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
            >
              <IconLogOut /> Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;