'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Project {
  id: string
  created_at: string
  input_image_url: string
  output_image_url: string | null
  prompt: string
  status: string
}

interface ProjectGalleryProps {
  projects: Project[]
  onDelete: (projectId: string) => void
}

export default function ProjectGallery({ projects, onDelete }: ProjectGalleryProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return
    }

    setDeleting(projectId)
    try {
      await onDelete(projectId)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun projet pour le moment</h3>
        <p className="text-gray-500">Créez votre première image avec l'IA ci-dessus !</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="card-hover group">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Image d'origine</p>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    project.status === 'completed'
                      ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                      : project.status === 'processing'
                      ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                      : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                  }`}
                >
                  {project.status === 'completed'
                    ? '✓ Terminé'
                    : project.status === 'processing'
                    ? '⏳ En cours'
                    : '✗ Échoué'}
                </span>
              </div>
              <div className="relative w-full h-52 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-soft group-hover:shadow-medium transition-all duration-300">
                <Image
                  src={project.input_image_url}
                  alt="Image d'origine"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {project.output_image_url && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Image générée</p>
                <div className="relative w-full h-52 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl overflow-hidden shadow-soft group-hover:shadow-medium transition-all duration-300 border-2 border-primary-200">
                  <Image
                    src={project.output_image_url}
                    alt="Image générée"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prompt</p>
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{project.prompt}</p>
            </div>

            <button
              onClick={() => handleDelete(project.id)}
              disabled={deleting === project.id}
              className="w-full btn btn-danger text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting === project.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Suppression...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </span>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

