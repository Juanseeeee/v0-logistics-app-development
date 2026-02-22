// Helper function to convert logo to base64 for PDF
export async function getLogoBase64(): Promise<string> {
  // For now, we'll use a direct fetch approach
  // In production, you might want to cache this
  try {
    const response = await fetch('/logo.png')
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('[v0] Failed to load logo:', error)
    return ''
  }
}
