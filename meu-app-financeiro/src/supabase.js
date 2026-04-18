import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wiaknfgoxuagkydemfaw.supabase.co'
const supabaseAnonKey = 'sb_publishable_UY8XvZFV6iRrcejpUZ-l2w_zOhG0pq1'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)