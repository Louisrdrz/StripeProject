import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Replicate from 'replicate'

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

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 === API GENERATE appelée ===')
    
    // Récupérer le token depuis le header Authorization
    const authHeader = request.headers.get('Authorization')
    console.log('📝 Auth header présent:', !!authHeader)
    let token = authHeader?.replace('Bearer ', '')
    
    // Si pas dans le header, essayer les cookies (fallback)
    if (!token) {
      console.log('🍪 Pas de token dans header, vérification cookies...')
      const cookies = request.cookies
      token = 
        cookies.get('sb-access-token')?.value ||
        cookies.get('supabase-auth-token')?.value
      
      if (!token) {
        const allCookies = cookies.getAll()
        console.log('🍪 Tous les cookies:', allCookies.map(c => c.name))
        const authCookie = allCookies.find(c => 
          c.name.includes('access-token') || 
          c.name.includes('auth-token')
        )
        token = authCookie?.value
      }
    }
    
    if (!token) {
      console.log('❌ Aucun token trouvé')
      return NextResponse.json({ error: 'Non authentifié - token manquant' }, { status: 401 })
    }

    console.log('✅ Token trouvé, longueur:', token.length)
    console.log('🔐 Validation du token avec supabaseAuth...')

    // Utiliser le client avec anon key pour valider le token utilisateur
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError) {
      console.log('❌ Erreur de validation:', authError.message)
      return NextResponse.json({ 
        error: 'Non authentifié - ' + authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.log('❌ User null après validation')
      return NextResponse.json({ 
        error: 'Non authentifié - utilisateur invalide' 
      }, { status: 401 })
    }
    
    console.log('✅ User validé:', user.id, user.email)

    // Récupérer les données du formulaire
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null
    const referenceImageFile = formData.get('referenceImage') as File | null
    const prompt = formData.get('prompt') as string

    if ((!imageFile && !imageUrl) || !prompt) {
      return NextResponse.json(
        { error: 'Image (fichier ou URL) et prompt requis' },
        { status: 400 }
      )
    }

    console.log('🎨 Prompt de transformation:', prompt)
    console.log('🖼️ Image de référence fournie:', !!referenceImageFile)

    // Vérifier l'abonnement et le quota
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif' },
        { status: 403 }
      )
    }

    if (subscription.quota_used >= subscription.quota_limit) {
      return NextResponse.json(
        { error: 'Quota atteint' },
        { status: 403 }
      )
    }

    // 1. Obtenir l'URL de l'image (soit upload, soit URL fournie)
    let publicUrl: string

    if (imageUrl) {
      // Utiliser l'URL fournie (image déjà uploadée)
      console.log('📷 Utilisation de l\'URL fournie:', imageUrl)
      publicUrl = imageUrl
    } else {
      // Upload la nouvelle image dans Supabase Storage
      console.log('📤 Upload d\'une nouvelle image...')
      const fileName = `${user.id}/${Date.now()}-${imageFile!.name}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('input-images')
        .upload(fileName, imageFile!, {
          contentType: imageFile!.type,
        })

      if (uploadError) {
        console.error('Erreur upload:', uploadError)
        return NextResponse.json(
          { error: 'Erreur lors de l\'upload' },
          { status: 500 }
        )
      }

      // 2. Récupérer l'URL publique
      const { data: { publicUrl: uploadedUrl } } = supabaseAdmin.storage
        .from('input-images')
        .getPublicUrl(uploadData.path)
      
      publicUrl = uploadedUrl
      console.log('✅ Image uploadée:', publicUrl)
    }

    // 3. Créer le projet dans la DB
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: user.id,
        input_image_url: publicUrl,
        prompt,
        status: 'processing',
      })
      .select()
      .single()

    if (projectError) {
      console.error('Erreur création projet:', projectError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du projet' },
        { status: 500 }
      )
    }

    // 4. Gérer l'image de référence (si fournie)
    let referenceImageUrl: string | null = null
    
    if (referenceImageFile) {
      console.log('📸 Upload de l\'image de référence...')
      const refFileName = `${user.id}/${Date.now()}-reference-${referenceImageFile.name}`
      const { data: refUploadData, error: refUploadError } = await supabaseAdmin.storage
        .from('input-images')
        .upload(refFileName, referenceImageFile, {
          contentType: referenceImageFile.type,
        })

      if (refUploadError) {
        console.error('⚠️ Erreur upload image de référence:', refUploadError)
      } else {
        const { data: { publicUrl: refPublicUrl } } = supabaseAdmin.storage
          .from('input-images')
          .getPublicUrl(refUploadData.path)
        
        referenceImageUrl = refPublicUrl
        console.log('✅ Image de référence uploadée:', referenceImageUrl)
      }
    }

    // 5. Appeler Replicate avec le modèle approprié
    let modelId: string
    let modelInput: any
    
    if (referenceImageUrl) {
      // Utiliser PhotoMaker pour une transformation avec référence
      modelId = 'tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4'
      console.log('🎨 Utilisation de PhotoMaker avec image de référence')
      
      modelInput = {
        prompt: prompt,
        input_image: publicUrl,
        style_image: referenceImageUrl,
        num_steps: 20,
        style_strength_ratio: 20,
        num_outputs: 1,
      }
    } else {
      // Utiliser Nano-Banana par défaut (comme dans le projet chaussures)
      modelId = process.env.REPLICATE_MODEL_ID || 'google/nano-banana'
      console.log('🎨 Utilisation de Nano-Banana (modèle standard)')
      
      modelInput = {
        image: publicUrl,
        prompt: prompt,
      }
    }
    
    console.log('🚀 Appel à Replicate avec le modèle:', modelId)
    let output: any
    try {
      output = await replicate.run(modelId as any, {
        input: modelInput,
      })
      
      console.log('✅ Réponse Replicate reçue')
    } catch (replicateError: any) {
      console.error('❌ Erreur Replicate:', replicateError)
      
      // Mettre à jour le statut à failed
      await supabaseAdmin
        .from('projects')
        .update({ status: 'failed' })
        .eq('id', project.id)

      return NextResponse.json(
        { error: 'Erreur lors de la génération IA: ' + replicateError.message },
        { status: 500 }
      )
    }

    // 6. Télécharger l'image générée
    const outputUrl = Array.isArray(output) ? output[0] : output
    const imageResponse = await fetch(outputUrl)
    const imageBlob = await imageResponse.blob()

    // 7. Upload l'image générée
    const outputFileName = `${user.id}/${Date.now()}-output.png`
    const { data: outputUploadData, error: outputUploadError } = await supabaseAdmin.storage
      .from('output-images')
      .upload(outputFileName, imageBlob, {
        contentType: 'image/png',
      })

    if (outputUploadError) {
      console.error('Erreur upload output:', outputUploadError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload du résultat' },
        { status: 500 }
      )
    }

    const { data: { publicUrl: outputPublicUrl } } = supabaseAdmin.storage
      .from('output-images')
      .getPublicUrl(outputUploadData.path)

    // 8. Mettre à jour le projet
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        output_image_url: outputPublicUrl,
        status: 'completed',
      })
      .eq('id', project.id)

    if (updateError) {
      console.error('Erreur mise à jour projet:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    // 9. Incrémenter le quota utilisé
    await supabaseAdmin
      .from('subscriptions')
      .update({
        quota_used: subscription.quota_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        output_image_url: outputPublicUrl,
      },
    })
  } catch (error: any) {
    console.error('Erreur générale:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}

