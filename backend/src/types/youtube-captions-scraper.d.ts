declare module "youtube-captions-scraper" {
  export function getSubtitles(options: { videoID: string; lang?: string }): Promise<Array<{ text: string; start: string; duration: string }>>;
}
