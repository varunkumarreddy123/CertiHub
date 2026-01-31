import type { User, LoginCredentials, SignupData, UserRole } from '@/types';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

const USERS_KEY = 'certichain_users';
const CURRENT_USER_KEY = 'certichain_current_user';

function mapProfileToUser(row: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
  institution_name: string | null;
  institution_address: string | null;
  wallet_address: string | null;
  created_at: string;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    isVerified: row.is_verified,
    institutionName: row.institution_name ?? undefined,
    institutionAddress: row.institution_address ?? undefined,
    walletAddress: row.wallet_address ?? undefined,
  };
}

// Default super admin (used when Supabase is disabled)
const DEFAULT_SUPER_ADMIN: User = {
  id: 'superadmin-001',
  email: 'superadmin@certichain.com',
  name: 'Super Admin',
  role: 'superadmin',
  createdAt: new Date().toISOString(),
  isVerified: true,
};

class AuthService {
  private users: User[] = [];

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      this.users = JSON.parse(stored);
    } else {
      this.users = [DEFAULT_SUPER_ADMIN];
      this.saveUsers();
    }
  }

  private saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  private setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    if (isSupabaseEnabled() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message);
      const user = await this.fetchProfile(data.user.id);
      if (!user) throw new Error('Profile not found');
      if (user.role === 'admin' && !user.isVerified) {
        await supabase.auth.signOut();
        throw new Error('Your institution account is pending verification by the Super Admin.');
      }
      const token = data.session?.access_token ?? '';
      localStorage.setItem('certichain_token', token);
      this.setCurrentUser(user);
      return { user, token };
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    const user = this.users.find(u => u.email === credentials.email);
    if (!user) throw new Error('Invalid email or password');
    if (credentials.email === 'superadmin@certichain.com' && credentials.password !== 'admin123') {
      throw new Error('Invalid email or password');
    }
    if (user.role === 'admin' && !user.isVerified) {
      throw new Error('Your institution account is pending verification by the Super Admin.');
    }
    const token = btoa(`${user.id}:${Date.now()}`);
    this.setCurrentUser(user);
    localStorage.setItem('certichain_token', token);
    return { user, token };
  }

  async signup(data: SignupData): Promise<{ user: User; token: string }> {
    if (isSupabaseEnabled() && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
            institution_name: data.institutionName,
            institution_address: data.institutionAddress,
          },
        },
      });
      if (error) throw new Error(error.message === 'User already registered' ? 'Email already registered' : error.message);
      if (!authData.user) throw new Error('Signup failed');

      // Trigger creates profile with metadata; update in case session exists (e.g. email confirmation off)
      const isVerified = data.role !== 'admin';
      await supabase
        .from('profiles')
        .update({
          name: data.name,
          role: data.role,
          is_verified: isVerified,
          institution_name: data.institutionName ?? null,
          institution_address: data.institutionAddress ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);

      // When signing up as institution (admin), also create an application record for Super Admin
      if (data.role === 'admin' && data.institutionName && data.institutionAddress) {
        await supabase.from('institution_applications').insert({
          user_id: authData.user.id,
          institution_name: data.institutionName,
          institution_address: data.institutionAddress,
          registration_number: 'Pending',
          contact_email: data.email,
          contact_phone: 'Pending',
          status: 'pending',
        });
      }

      // Trigger creates profile; allow a short delay for DB trigger to run
      let user = await this.fetchProfile(authData.user.id);
      if (!user) {
        await new Promise(r => setTimeout(r, 800));
        user = await this.fetchProfile(authData.user.id);
      }
      if (!user) throw new Error('Profile not found. If you enabled email confirmation, confirm your email and log in.');
      const token = authData.session?.access_token ?? '';
      if (token) {
        localStorage.setItem('certichain_token', token);
        this.setCurrentUser(user);
      }
      return { user, token };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    if (this.users.some(u => u.email === data.email)) throw new Error('Email already registered');
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: new Date().toISOString(),
      isVerified: data.role === 'user',
      institutionName: data.institutionName,
      institutionAddress: data.institutionAddress,
    };
    this.users.push(newUser);
    this.saveUsers();
    const token = btoa(`${newUser.id}:${Date.now()}`);
    this.setCurrentUser(newUser);
    localStorage.setItem('certichain_token', token);
    return { user: newUser, token };
  }

  logout(): void {
    if (isSupabaseEnabled() && supabase) {
      void supabase.auth.signOut();
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('certichain_token');
  }

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser() && !!localStorage.getItem('certichain_token');
  }

  private async fetchProfile(userId: string): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return mapProfileToUser(data);
  }

  async refreshSession(): Promise<User | null> {
    if (!isSupabaseEnabled() || !supabase) return this.getCurrentUser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      this.setCurrentUser(null);
      localStorage.removeItem('certichain_token');
      return null;
    }
    const user = await this.fetchProfile(session.user.id);
    if (user) {
      this.setCurrentUser(user);
      localStorage.setItem('certichain_token', session.access_token);
    }
    return user;
  }

  getAllUsers(): User[] {
    if (isSupabaseEnabled() && supabase) {
      // Sync call not possible; return from cache. Callers that need fresh data should use getAllUsersAsync.
      return [];
    }
    return [...this.users];
  }

  async getAllUsersAsync(): Promise<User[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data ?? []).map(mapProfileToUser);
    }
    return [...this.users];
  }

  getPendingAdmins(): User[] {
    if (isSupabaseEnabled()) return []; // Use getPendingAdminsAsync
    return this.users.filter(u => u.role === 'admin' && !u.isVerified);
  }

  async getPendingAdminsAsync(): Promise<User[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'admin').eq('is_verified', false);
      return (data ?? []).map(mapProfileToUser);
    }
    return this.users.filter(u => u.role === 'admin' && !u.isVerified);
  }

  async verifyAdmin(userId: string): Promise<User> {
    if (isSupabaseEnabled() && supabase) {
      const { data, error } = await supabase.from('profiles').update({ is_verified: true, updated_at: new Date().toISOString() }).eq('id', userId).select().single();
      if (error) throw new Error('User not found');
      const user = mapProfileToUser(data);
      if (this.getCurrentUser()?.id === userId) this.setCurrentUser(user);
      return user;
    }
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.isVerified = true;
    this.saveUsers();
    if (this.getCurrentUser()?.id === userId) this.setCurrentUser(user);
    return user;
  }

  async rejectAdmin(userId: string): Promise<void> {
    if (isSupabaseEnabled() && supabase) {
      await supabase.from('profiles').delete().eq('id', userId);
      return;
    }
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    this.users.splice(index, 1);
    this.saveUsers();
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    if (isSupabaseEnabled() && supabase) {
      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.institutionName !== undefined) row.institution_name = updates.institutionName;
      if (updates.institutionAddress !== undefined) row.institution_address = updates.institutionAddress;
      if (updates.walletAddress !== undefined) row.wallet_address = updates.walletAddress;
      const { data, error } = await supabase.from('profiles').update(row).eq('id', userId).select().single();
      if (error) throw new Error('User not found');
      const user = mapProfileToUser(data);
      if (this.getCurrentUser()?.id === userId) this.setCurrentUser(user);
      return user;
    }
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);
    this.saveUsers();
    if (this.getCurrentUser()?.id === userId) this.setCurrentUser(user);
    return user;
  }

  getUserById(userId: string): User | null {
    if (isSupabaseEnabled()) return null; // Use getUserByIdAsync
    return this.users.find(u => u.id === userId) ?? null;
  }

  async getUserByIdAsync(userId: string): Promise<User | null> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data ? mapProfileToUser(data) : null;
    }
    return this.users.find(u => u.id === userId) ?? null;
  }

  getUsersByRole(role: UserRole): User[] {
    if (isSupabaseEnabled()) return [];
    return this.users.filter(u => u.role === role);
  }

  async getUsersByRoleAsync(role: UserRole): Promise<User[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('role', role);
      return (data ?? []).map(mapProfileToUser);
    }
    return this.users.filter(u => u.role === role);
  }

  async changePassword(userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export const authService = new AuthService();
export default authService;
