import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserProfile {
  email: string;
  displayName: string;
  photoURL?: string;
  isPaid: boolean;
  glowColor: string;
  hasMapAccess: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  activeTheme: { name: string, color: string, hex: string };
  setTheme: (theme: { name: string, color: string, hex: string }) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  login: (email: string, password?: string) => Promise<{ hasMapAccess: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { displayName?: string, photoURL?: string, glowColor?: string }) => Promise<any>;
  isResetRegistered: boolean;
  setIsResetRegistered: (registered: boolean) => void;
}

const THEMES = {
  GROUNDED: { name: 'Grounded', color: 'rgba(255, 193, 7, 0.5)', hex: '#FFC107' },
  DEEP: { name: 'Deep', color: 'rgba(33, 150, 243, 0.6)', hex: '#2196F3' },
  SOFT: { name: 'Soft', color: 'rgba(76, 175, 80, 0.6)', hex: '#4CAF50' },
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  userEmail: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  activeTheme: THEMES.GROUNDED,
  setTheme: () => { },
  showLoginModal: false,
  setShowLoginModal: () => { },
  login: async () => ({ hasMapAccess: false }),
  logout: async () => { },
  updateProfile: async () => null,
  isResetRegistered: false,
  setIsResetRegistered: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isResetRegistered, setIsResetRegistered] = useState(false);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`sanctuary-reset-registered-${userEmail}`, isResetRegistered ? 'true' : 'false');
    }
  }, [isResetRegistered, userEmail]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!userEmail) {
        setIsResetRegistered(false);
        return;
      }
      try {
        const res = await fetch(`/api/reset-registration/check?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setIsResetRegistered(!!data.registered);
        } else {
          setIsResetRegistered(false);
        }
      } catch (e) {
        console.error('Failed to check reset registration status:', e);
        setIsResetRegistered(false);
      }
    };
    checkRegistration();
  }, [userEmail]);

  const [activeTheme, setActiveTheme] = useState(() => {
    const saved = localStorage.getItem('sanctuary-theme');
    return saved ? JSON.parse(saved) : THEMES.GROUNDED;
  });

  const setTheme = (theme: { name: string, color: string, hex: string }) => {
    setActiveTheme(theme);
    localStorage.setItem('sanctuary-theme', JSON.stringify(theme));
    document.documentElement.style.setProperty('--glow-color', theme.color);
    document.documentElement.style.setProperty('--theme-hex', theme.hex);
  };

  const login = async (email: string, password?: string) => {
    const lowerEmail = email.toLowerCase().trim();

    // Fetch backend url from VITE_API_URL or fallback
    const apiUrl = ((import.meta as any).env?.VITE_API_URL || 'https://anlms-backend-three.vercel.app/api').trim().replace(/\/+$/, '') + '/';

    let resData: any;
    try {
      const response = await fetch(`${apiUrl}users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: lowerEmail, password, rememberMe: true })
      });

      const text = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response.');
      }

      if (!response.ok) {
        throw new Error(parsed?.message || 'Invalid email or password');
      }

      resData = parsed.data;
    } catch (err: any) {
      console.error('ANLMS Login Error:', err);
      throw new Error(err.message || 'Login failed. Please check your credentials.');
    }

    const { token, user } = resData;

    // Check sanctuary access: verify enrollment in Shadow Mastery Coaching courses
    const SHADOW_MASTERY_COURSE_IDS = ['69aaa6a2cf49b8e4901b2b5c', '69aea4a8b2973eb1ea255770'];
    const isAdminOrCoach = user.role === 'ADMIN' || user.role === 'COACH';

    if (!isAdminOrCoach) {
      try {
        const dashboardRes = await fetch(`${apiUrl}student/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          const enrolledCourses = dashboardData?.data?.courses || [];
          const hasShadowMastery = enrolledCourses.some(
            (course: any) => SHADOW_MASTERY_COURSE_IDS.includes(course.id)
          );

          if (!hasShadowMastery) {
            throw new Error("Access denied as you don't have the Shadow Mastery course. Please enroll first.");
          }
        } else {
          // If dashboard fetch fails, fall back to the hasSancturyAccess flag
          if (!user.hasSancturyAccess) {
            throw new Error("Access denied as you don't have the Shadow Mastery course. Please enroll first.");
          }
        }
      } catch (enrollErr: any) {
        // Re-throw access denied errors
        if (enrollErr.message.includes('Access denied')) {
          throw enrollErr;
        }
        // For network errors, fall back to the hasSancturyAccess flag
        if (!user.hasSancturyAccess) {
          throw new Error("Access denied as you don't have the Shadow Mastery course. Please enroll first.");
        }
      }
    }

    // Set local state, session ID, and LMS token
    const sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sanctuary-session-id', sessionId);
    localStorage.setItem('sanctuary-lms-token', token);

    // Create/Update user profile in Sanctuary MongoDB via API
    try {
      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: user.name || '',
          photoURL: user.avatar || '',
          glowColor: activeTheme.color
        })
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data);
      }
    } catch (e) {
      console.error('Failed to create/update profile via API:', e);
    }

    // Set local state
    setIsLoggedIn(true);
    setIsAdmin(false);
    setUserEmail(lowerEmail);
    localStorage.setItem('sanctuary-user-email', lowerEmail);

    return { hasMapAccess: true };
  };

  const updateProfile = async (updates: { displayName?: string, photoURL?: string, glowColor?: string }) => {
    if (!userEmail) return;
    try {
      const token = localStorage.getItem('sanctuary-lms-token');
      if (!token) return;
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const resData = await res.json();
        setProfile(resData.data);
        return resData.data;
      }
    } catch (err) {
      console.error('Failed to update profile via API:', err);
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail(null);
    setProfile(null);
    setIsResetRegistered(false);
    localStorage.removeItem('sanctuary-user-email');
    localStorage.removeItem('sanctuary-session-id');
    localStorage.removeItem('sanctuary-lms-token');
  };

  const fetchProfile = async () => {
    if (!userEmail) return;
    try {
      const token = localStorage.getItem('sanctuary-lms-token');
      if (!token) return;
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const resData = await res.json();
        setProfile(resData.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile via API:', err);
    }
  };

  useEffect(() => {
    // Apply initial theme to CSS variables
    document.documentElement.style.setProperty('--glow-color', activeTheme.color);
    document.documentElement.style.setProperty('--theme-hex', activeTheme.hex);

    // Load local session
    const savedEmail = localStorage.getItem('sanctuary-user-email');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsLoggedIn(true);
      setIsAdmin(false);
      const savedReg = localStorage.getItem(`sanctuary-reset-registered-${savedEmail}`) === 'true';
      setIsResetRegistered(savedReg);
    } else {
      setIsLoggedIn(false);
      setIsResetRegistered(false);
    }
    setIsAuthReady(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [userEmail]);

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      isAdmin,
      userEmail,
      profile,
      loading,
      isAuthReady,
      activeTheme,
      setTheme,
      showLoginModal,
      setShowLoginModal,
      login,
      logout,
      updateProfile,
      isResetRegistered,
      setIsResetRegistered
    }}>
      {children}
    </AuthContext.Provider>
  );
};
