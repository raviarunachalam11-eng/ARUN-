import { db } from './database';
import { User } from '../types';

export const hashPassword = async (password: string): Promise<string> => {
  // Simple hash function for demo - in production use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const registerUser = async (username: string, password: string): Promise<boolean> => {
  try {
    // Check if user already exists
    const existingUser = await db.users.where('username').equals(username).first();
    if (existingUser) {
      return false;
    }

    const hashedPassword = await hashPassword(password);
    await db.users.add({
      username,
      password: hashedPassword
    });
    return true;
  } catch (error) {
    console.error('Registration error:', error);
    return false;
  }
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const user = await db.users.where('username').equals(username).first();
    if (!user) {
      return null;
    }

    const hashedPassword = await hashPassword(password);
    if (user.password === hashedPassword) {
      return user;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const getCurrentUser = (): number | null => {
  const userId = localStorage.getItem('userId');
  return userId ? parseInt(userId) : null;
};

export const setCurrentUser = (userId: number): void => {
  localStorage.setItem('userId', userId.toString());
};

export const logout = (): void => {
  localStorage.removeItem('userId');
};

