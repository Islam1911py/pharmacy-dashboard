'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Package, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await api.post('/api/auth/login', {
        email,
        password,
      });

      if (response.success) {
        const { user, tokens } = response.data;
        console.log('✓ Login successful, setting auth...', tokens);
        
        // Set auth in Zustand (which triggers persist middleware)
        setAuth(user, tokens);
        
        // Also manually save to localStorage to ensure it's available immediately
        const authData = {
          state: {
            user,
            tokens,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('pharmacy-auth-storage', JSON.stringify(authData));
        console.log('✓ Tokens manually saved to localStorage:', tokens.accessToken.substring(0, 20) + '...');
        
        toast.success('Login successful!');
        
        // Small delay to ensure localStorage is written before navigation
        await new Promise(resolve => setTimeout(resolve, 50));
        router.push('/dashboard');
      } else {
        toast.error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Pharmacy Management</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pharmacy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <p>Email: admin@pharmacy.com / Password: admin123</p>
            <p>Email: manager@pharmacy.com / Password: manager123</p>
            <p>Email: supervisor@pharmacy.com / Password: supervisor123</p>
            <p>Email: employee@pharmacy.com / Password: employee123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
