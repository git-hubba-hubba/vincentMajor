import { api } from './api';

export async function uploadPostVideo(file) {
  if (!['video/mp4', 'video/webm'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('Choose an MP4 or WebM video up to 20 MB.');
  const duration = await new Promise((resolve, reject) => {
    const player = document.createElement('video');
    const url = URL.createObjectURL(file);
    player.preload = 'metadata';
    player.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      Number.isFinite(player.duration) && player.duration > 0 && player.duration <= 3600 ? resolve(player.duration) : reject(new Error('Choose a playable video up to one hour long.'));
    };
    player.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This video cannot be played. Try another MP4 or WebM file.')); };
    player.src = url;
  });
  const video = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the video.'));
    reader.readAsDataURL(file);
  });
  return (await api('/post-video', { method: 'POST', body: JSON.stringify({ video, duration }) })).video_url;
}
