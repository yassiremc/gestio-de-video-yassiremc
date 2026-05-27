export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  const shortMatch = trimmed.match(/^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch?.[2]) {
    return shortMatch[2];
  }

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch?.[1]) {
    return watchMatch[1];
  }

  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch?.[1]) {
    return embedMatch[1];
  }

  return null;
};

export const createYouTubeThumbnailUrl = (videoId) =>
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export const createYouTubeEmbedUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`;

export const tryLoadVideoMeta = async (originalUrl, fallbackVideoId) => {
  try {
    const response = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(originalUrl)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || `Video ${fallbackVideoId}`,
      thumbnail: data.thumbnail_url || createYouTubeThumbnailUrl(fallbackVideoId),
      author: data.author_name || "",
    };
  } catch (error) {
    return null;
  }
};
