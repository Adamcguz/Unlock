import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key starts with:', supabaseServiceKey?.substring(0, 20));
console.log('Service key length:', supabaseServiceKey?.length);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getAuthUser(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }
  return data.user.id;
}
