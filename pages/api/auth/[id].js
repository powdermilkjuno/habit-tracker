import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', id)

    if (error) return res.status(500).json(error)
    return res.status(200).json(data[0])
  }

  res.status(405).json({ message: 'Method not allowed' })
}