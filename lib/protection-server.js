import { createClient } from '@supabase/supabase-js'

export function protectionClient() {
  if (process.env.PROTECTED_PAYMENTS_TEST !== 'true' || !process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Protected payments require the test feature flag and a Paystack test key.')
  return createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}
export async function protectionUser(request, db) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) throw new Error('Sign in to continue.')
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user?.email_confirmed_at) throw new Error('A verified email account is required.')
  return data.user
}
export function isProtectionAdmin(user) {
  return (process.env.PROTECTED_ADMIN_USER_IDS || '').split(',').map(x => x.trim()).includes(user.id)
}
