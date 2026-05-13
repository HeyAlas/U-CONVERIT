import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────
// SIGN UP — Create new account + send OTP
// ─────────────────────────────────────────
export async function signUp({ fullName, email, password }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    return { 
      success: true, 
      data,
      message: 'Account created! Check your email for the verification code.'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ─────────────────────────────────────────
// VERIFY OTP — Confirm 6-digit code
// ─────────────────────────────────────────
export async function verifyOtp({ email, token }) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw error;

    return { 
      success: true, 
      data,
      message: 'Email verified successfully!'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ─────────────────────────────────────────
// RESEND OTP — Send new code
// ─────────────────────────────────────────
export async function resendOtp(email) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;

    return { 
      success: true,
      message: 'New code sent! Check your email.'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ─────────────────────────────────────────
// LOGIN — Sign in with email/password
// ─────────────────────────────────────────
export async function login({ email, password }) {
  try {
    // 1. Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // 2. Fetch user role from BACKEND (bypasses RLS)
    let role = 'user';
    try {
      const res = await fetch(`http://localhost:8000/api/profile/${data.user.id}`);
      const profileData = await res.json();
      
      if (profileData.success && profileData.profile) {
        role = profileData.profile.role || 'user';
        console.log('✅ Role fetched from backend:', role);
      } else {
        console.warn('⚠️ Backend returned no profile, falling back to direct query');
        
        // 3. Fallback: Try Supabase direct query
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (userProfile) {
          role = userProfile.role || 'user';
          console.log('✅ Role fetched via Supabase fallback:', role);
        }
      }
    } catch (fetchErr) {
      console.warn('⚠️ Backend fetch failed:', fetchErr);
      
      // Fallback to direct Supabase query
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (userProfile) {
          role = userProfile.role || 'user';
        }
      } catch (e) {
        console.error('All role fetch methods failed:', e);
      }
    }

    return { 
      success: true, 
      data: {
        ...data,
        role: role,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ─────────────────────────────────────────
// LOGOUT — Sign out current user
// ─────────────────────────────────────────
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ─────────────────────────────────────────
// GET CURRENT USER — Check who's logged in
// ─────────────────────────────────────────
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;

    // Get full profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) console.warn('Profile fetch error:', profileError);

    return {
      ...user,
      profile,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}