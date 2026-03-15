export const flattenVideos = (tree: any[]) => {
  // Tree is expected to have sections, and each section has videos
  // Videos must be flattened and sorted globally based on section order, then video order
  let flattened: any[] = [];
  
  const sortedSections = [...tree].sort((a, b) => a.order_index - b.order_index);
  for (const section of sortedSections) {
    const sortedVideos = [...(section.videos || [])].sort((a, b) => a.order_index - b.order_index);
    for (const video of sortedVideos) {
      flattened.push({
        ...video,
        section_id: section.id,
        section_title: section.title,
      });
    }
  }
  return flattened;
};
