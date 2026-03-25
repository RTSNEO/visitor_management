import './App.css'
import './i18n';
import LanguageToggle from './components/LanguageToggle';
import VisitorForm from './components/VisitorForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900 transition-colors">
      <header className="max-w-4xl mx-auto flex justify-end">
        <LanguageToggle />
      </header>

      <main>
        <VisitorForm />
      </main>
    </div>
  )
}

export default App