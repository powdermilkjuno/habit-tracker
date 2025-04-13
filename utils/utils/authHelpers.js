import { supabase } from '@/lib/supabaseClient'

export async function createUserProfile(userId, username) {
  // 1. Generate share code
  const { data: codeData, error: codeError } = await supabase.rpc(
    'generate_share_code'
  );

  if (codeError) throw new Error('Failed to generate share code');

  // 2. Create user profile
  const { data, error } = await supabase
    .from('users')
    .insert([{
      user_id: userId,
      username,
      share_code: codeData, // Store the generated code
      height: 0,
      weight: 0,
      goal: 'cut',
      sex: null,
      icon: ''
    }]);

  return { data, error };
}