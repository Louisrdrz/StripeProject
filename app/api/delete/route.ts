import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client pour valider les tokens utilisateurs
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Client admin pour les opérations sur la base de données et le storage
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.replace('Bearer ', '')
    
    // Si pas dans le header, essayer les cookies (fallback)
    if (!token) {
      const cookies = request.cookies
      token = cookies.get('sb-access-token')?.value
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Utiliser le client avec anon key pour valider le token utilisateur
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID requis' }, { status: 400 })
    }

    // Récupérer le projet
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 })
    }

    // Vérifier l'ownership
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Supprimer les images du storage
    if (project.input_image_url) {
      const inputPath = project.input_image_url.split('/input-images/')[1]
      if (inputPath) {
        await supabaseAdmin.storage.from('input-images').remove([inputPath])
      }
    }

    if (project.output_image_url) {
      const outputPath = project.output_image_url.split('/output-images/')[1]
      if (outputPath) {
        await supabaseAdmin.storage.from('output-images').remove([outputPath])
      }
    }

    // Supprimer le projet de la DB
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Erreur suppression:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}

