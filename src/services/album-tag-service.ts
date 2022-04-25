import { AlbumTag } from 'src/components/models';
import HttpRequestService from 'src/services/http-request-service';

export default class AlbumTagService extends HttpRequestService {
  constructor() {
    super();
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? (process.env.GOOGLE_CLOUD_FUNCTION_URL as string) + '/api/albumTags'
        : `http://localhost:5001/${process.env.GOOGLE_FIREBASE_PROJECT_ID}/us-central1/main/api/albumTags`;
  }

  getAlbumTags(): Promise<AlbumTag[]> {
    this.setDisplayLoadingBar(false);
    return this.perform('GET', '');
  }

  createAlbumTag(tag: AlbumTag): Promise<any> {
    this.setDisplayLoadingBar(true);
    return this.perform('POST', '', tag);
  }

  deleteAlbum(tagId: string): Promise<any> {
    this.setDisplayLoadingBar(true);
    return this.perform('DELETE', `/${tagId}`);
  }
}
