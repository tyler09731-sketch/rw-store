import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// GET: Fetch all data for the admin dashboard
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: schemas } = await supabaseAdmin.from('category_schemas').select('*')
  const { data: products } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
  const { count: userCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
  const { count: orderCount } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true })

  return NextResponse.json({
    schemas: schemas || [],
    products: products || [],
    userCount: userCount || 0,
    orderCount: orderCount || 0
  })
}

// POST: Handle adding categories and products
export async function POST(req: Request) {
  const body = await req.json()
  const { password, action, ...data } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (action === 'add_category') {
    const { error } = await supabaseAdmin.from('category_schemas').insert({
      category: data.category,
      fields: data.fields,
      default_view: data.default_view
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'add_product') {
    const { error } = await supabaseAdmin.from('products').insert({
      title: data.title,
      category: data.category,
      price_usd: parseFloat(data.price_usd),
      image_url: data.image_url || null,
      metadata: data.metadata || {},
      is_sold: false
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE: Remove a product
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')
  const id = searchParams.get('id')

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabaseAdmin.from('products').delete().eq('id', id)
  return NextResponse.json({ success: true })
}