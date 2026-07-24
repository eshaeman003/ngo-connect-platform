import { createClient } from '@supabase/supabase-js'

// Direct values (temporary fix)
const supabaseUrl = 'https://qupcrrfkzjkoaogjfjvg.supabase.co'
const supabaseKey = 'sb_publishable_TZ63YI6jpCtItsyRNc67rA_KiADNBkZ'

export const supabase = createClient(supabaseUrl, supabaseKey)