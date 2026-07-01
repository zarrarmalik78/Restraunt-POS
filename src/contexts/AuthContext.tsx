import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  currentUser: any | null;
  userMetadata: any | null;
  userRole: 'admin' | 'cashier' | null;
  shopId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, shopName: string) => Promise<void>;
  logout: () => Promise<void>;
  registerCashier: (email: string, password: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  updateUserPassword: (password: string) => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userMetadata: null,
  userRole: null,
  shopId: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  registerCashier: async () => {},
  verifyPassword: async () => false,
  updateUserPassword: async () => {},
  updateUsername: async () => {},
  resetPassword: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = currentUser?.role || null;
  const shopId = currentUser?.shopId || null;
  const userMetadata = currentUser;

  useEffect(() => {
    // Check if there is an active session stored in localStorage/sessionStorage
    const storedUser = sessionStorage.getItem('gtrax_user') || localStorage.getItem('gtrax_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // 1. Fetch user from local SQLite DB
    const users = await db.users.toArray();
    const user = users.find(u => u.username === username || (u as any).email === username);

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Compare password hashes
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new Error('Invalid password');
    }

    // 3. Set current user session
    const sessionUser = {
      uid: user.id,
      id: user.id,
      username: user.username,
      email: (user as any).email || `${user.username}@gtrax-local.com`,
      role: user.role,
      shopId: user.shopId
    };

    setCurrentUser(sessionUser);
    sessionStorage.setItem('gtrax_user', JSON.stringify(sessionUser));
  };

  const signup = async (email: string, password: string, shopName: string) => {
    const shopId = 'default_shop';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create settings
    await db.settings.put({
      id: shopId,
      shopId,
      shopName,
      shopAddress: '',
      shopPhone: '',
      showShopAddress: false,
      showShopPhone: false,
      footerMessage: 'Thank you for your business!',
      shopLogo: null,
      currency: 'Rs',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create user
    await db.users.add({
      shopId,
      username: email.split('@')[0],
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await login(email.split('@')[0], password);
  };

  const logout = async () => {
    setCurrentUser(null);
    sessionStorage.removeItem('gtrax_user');
    localStorage.removeItem('gtrax_user');
  };

  const registerCashier = async (email: string, password: string) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await db.users.add({
      shopId: shopId || 'default_shop',
      username: email.split('@')[0],
      passwordHash,
      role: 'cashier',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!currentUser) return false;
    const users = await db.users.toArray();
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  };

  const updateUserPassword = async (password: string): Promise<void> => {
    if (!currentUser) throw new Error('Not logged in');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await db.users.update(currentUser.id, { passwordHash });
  };

  const updateUsername = async (username: string): Promise<void> => {
    if (!currentUser) throw new Error('Not logged in');
    await db.users.update(currentUser.id, { username });
    const updatedUser = { ...currentUser, username };
    setCurrentUser(updatedUser);
    sessionStorage.setItem('gtrax_user', JSON.stringify(updatedUser));
  };

  const resetPassword = async (email: string): Promise<void> => {
    throw new Error('Password reset is not supported offline. Contact your administrator.');
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      userMetadata,
      userRole, 
      shopId, 
      loading, 
      login, 
      signup, 
      logout, 
      registerCashier, 
      verifyPassword, 
      updateUserPassword, 
      updateUsername,
      resetPassword 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};



