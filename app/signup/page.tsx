import Header from '@/components/Header'
import AuthForm from '@/components/AuthForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-center">
          <AuthForm mode="signup" />
        </div>
      </main>
    </div>
  )
}

