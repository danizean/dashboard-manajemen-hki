// app/dashboard/pengaturan/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-browser'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, Save, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// Skema validasi untuk form
const settingsSchema = z.object({
  full_name: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter.' }),
  email: z.string().email(),
  password: z.string().optional(),
}).refine(data => !data.password || data.password.length === 0 || data.password.length >= 6, {
  message: 'Kata sandi baru minimal 6 karakter.',
  path: ['password'],
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    },
  });

  // Mengambil data pengguna saat komponen dimuat
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        form.reset({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          password: '',
        });
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [supabase, form]);

  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    const toastId = toast.loading('Memperbarui profil...');

    try {
      const { error } = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json());

      if (error) {
        throw new Error(error.message || 'Gagal memperbarui profil.');
      }

      toast.success('Profil berhasil diperbarui!', { id: toastId });
      form.reset({ ...form.getValues(), password: '' }); // Reset password field
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Akun</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola informasi profil dan keamanan akun Anda.
        </p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Profil Pengguna</CardTitle>
              <CardDescription>Perbarui nama lengkap dan kata sandi Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kata Sandi Baru</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah kata sandi.</p>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Simpan Perubahan
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}