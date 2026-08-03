const FR_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'Email not confirmed': 'Email non confirmé. Vérifie ta boîte mail.',
  'User already registered': 'Un compte existe déjà avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères',
  'For security purposes, you can only request this after 30 seconds': 'Trop de tentatives. Réessaie dans 30 secondes.',
  'Network request failed': 'Impossible de joindre le serveur.',
}

export function mapSupabaseError(message: string): string {
  return FR_ERRORS[message] ?? 'Une erreur est survenue. Réessaie.'
}
