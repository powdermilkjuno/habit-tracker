import { supabase } from '@/lib/supabaseClient'

export async function createUserProfile(userId, username) {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      user_id: userId,
      username: username,
      height: 0,
      weight: 0,
      goal: 'cut',
      sex: null,
      icon: ''
    }])

  return { data, error }
}