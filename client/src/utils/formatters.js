export const formatTopics = (topicsStr) => {
  if (!topicsStr) return 'None';
  try {
    const parsed = JSON.parse(topicsStr);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.isNonTeaching) {
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        return parsed.tasks.filter(t => t.task).map(t => `${t.day}: ${t.task}`).join(' | ');
      }
      return 'None';
    }
    if (Array.isArray(parsed)) {
      return parsed.map(t => `${t.class_name ? t.class_name + ': ' : ''}${t.topics || t.count}`).join(' | ');
    }
  } catch (e) {
    // legacy string
  }
  return topicsStr;
};