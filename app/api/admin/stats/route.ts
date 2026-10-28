import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use the Secret Key only on the server!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch stats
  const { count: userCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
  const { count: orderCount } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true })
  const { data: products } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })

  return NextResponse.json({
    userCount: userCount || 0,
    orderCount: orderCount || 0,
    products: products || []
  })
}