import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import LanguageToggle from '../components/LanguageToggle'
import i18n from '../i18n'

describe('LanguageToggle Component', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  })

  it('should render the language toggle button', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should display correct language text', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    )
    
    // Initial language is English, so button should show Arabic text
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('العربية')
  })

  it('should toggle language on button click', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(i18n.language).toBe('ar')
    })
  })

  it('should set document direction to RTL when Arabic is selected', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(document.documentElement.dir).toBe('rtl')
      expect(document.documentElement.lang).toBe('ar')
    })
  })

  it('should set document direction to LTR when English is selected', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    )
    
    // Click to change to Arabic
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(document.documentElement.dir).toBe('rtl')
    })

    // Click again to switch back to English
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(document.documentElement.dir).toBe('ltr')
      expect(document.documentElement.lang).toBe('en')
    })
  })

  it('should have proper styling', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white')
  })
})
