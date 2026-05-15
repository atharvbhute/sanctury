import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { 
  db, 
  OperationType, 
  handleFirestoreError
} from './firebase';

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
  login: (email: string) => Promise<{ hasMapAccess: boolean }>;
  logout: () => Promise<void>;
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
  setTheme: () => {},
  showLoginModal: false,
  setShowLoginModal: () => {},
  login: async () => ({ hasMapAccess: false }),
  logout: async () => {},
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

  const ADMIN_EMAILS = ['ivikaskhandelwal@gmail.com', 'aditinirvaan@gmail.com', 'ishietachopra1@gmail.com', 'atharv.bhute18@gmail.com'];

  const login = async (email: string) => {
    const lowerEmail = email.toLowerCase().trim();
    const isAdminUser = ADMIN_EMAILS.includes(lowerEmail);

    let authUserData: any = null;

    if (isAdminUser) {
      authUserData = { hasMapAccess: true, isAdmin: true };
    } else {
      // Check authorized_users collection
      const authUserRef = doc(db, 'authorized_users', lowerEmail);
      const authUserSnap = await getDoc(authUserRef);
      
      if (!authUserSnap.exists()) {
        throw new Error('Access Denied. This email is not on the Sanctuary whitelist.');
      }
      authUserData = authUserSnap.data();
    }
    
    // Set local state and session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sanctuary-session-id', sessionId);
    
    // Create/Update user profile and store session ID
    const userDocRef = doc(db, 'users', lowerEmail);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      const newProfile: UserProfile = {
        email: lowerEmail,
        displayName: '',
        photoURL: '',
        isPaid: false,
        glowColor: activeTheme.color,
        hasMapAccess: authUserData.hasMapAccess || false,
        isAdmin: !!authUserData.isAdmin,
      };
      await setDoc(userDocRef, { ...newProfile, sessionId }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${lowerEmail}`));
    } else {
      await updateDoc(userDocRef, { ...docSnap.data(), sessionId }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${lowerEmail}`));
    }
    
    // Set local state
    setIsLoggedIn(true);
    setIsAdmin(!!authUserData.isAdmin);
    setUserEmail(lowerEmail);
    localStorage.setItem('sanctuary-user-email', lowerEmail);
    
    return { hasMapAccess: authUserData.hasMapAccess || false };
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserEmail(null);
    setProfile(null);
    localStorage.removeItem('sanctuary-user-email');
    localStorage.removeItem('sanctuary-session-id');
  };

  useEffect(() => {
    // Apply initial theme to CSS variables
    document.documentElement.style.setProperty('--glow-color', activeTheme.color);
    document.documentElement.style.setProperty('--theme-hex', activeTheme.hex);
    
    // Load local session
    const savedEmail = localStorage.getItem('sanctuary-user-email');
    const savedSessionId = localStorage.getItem('sanctuary-session-id');
    if (savedEmail) {
      setUserEmail(savedEmail);
      
      // Verify session
      const userDocRef = doc(db, 'users', savedEmail);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().sessionId === savedSessionId) {
          setIsLoggedIn(true);
          setIsAdmin(ADMIN_EMAILS.includes(savedEmail));
        } else {
          // Session invalid, logout
          localStorage.removeItem('sanctuary-user-email');
          localStorage.removeItem('sanctuary-session-id');
          setIsLoggedIn(false);
        }
      });
    }
    setIsAuthReady(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userEmail) {
      const userDocRef = doc(db, 'users', userEmail);
      
      try {
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
          } else {
            setProfile(null);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userEmail}`);
        });
        
        return () => unsubProfile();
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${userEmail}`);
      }
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
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
