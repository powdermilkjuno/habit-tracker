import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.https://dfdmjzezvpefnrywxevv.supabase.co,
const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZG1qemV6dnBlZm5yeXd4ZXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODA3NzksImV4cCI6MjA2MDA1Njc3OX0.ivaujOU1hoGP_HLgfTAb3qRp7aQ_peqw0hwXWIZmlgs

export const supabase = createClient(supabaseUrl, supabaseKey)