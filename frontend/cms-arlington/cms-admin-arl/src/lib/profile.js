export const profileThemes = ['ocean','sunset','forest','midnight'];
export function profileGallery(user) { try {const value=JSON.parse(user?.profile_gallery || '[]');return Array.isArray(value)?value:[];} catch {return [];} }
