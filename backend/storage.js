const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

export async function persistImage(value, folder) {
  if (!value || !String(value).startsWith('data:image/')) return value;
  if (!cloudName || !uploadPreset) {
    if (process.env.NODE_ENV === 'production') throw new Error('Image storage is not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.');
    return value;
  }
  const form = new FormData();
  form.append('file', value);
  form.append('upload_preset', uploadPreset);
  form.append('folder', folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method:'POST', body:form });
  const result = await response.json();
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Image upload failed.');
  return result.secure_url;
}
