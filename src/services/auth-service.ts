import HttpRequestService from 'src/services/http-request-service';
import { UserPermission } from 'src/stores/user-store';

export default class AuthService extends HttpRequestService {
  constructor() {
    super();
    this.baseUrl =
      process.env.NODE_ENV === 'production'
        ? (process.env.GOOGLE_CLOUD_FUNCTION_URL as string) + '/api/auth'
        : `http://localhost:5001/${process.env.GOOGLE_FIREBASE_PROJECT_ID}/us-central1/main/api/auth`;
  }

  verifyIdToken(googleIdToken: string | undefined, token: string): Promise<UserPermission> {
    this.setDisplayingParameters(true);
    return this.perform('POST', '/verifyIdToken', { googleIdToken, token });
  }

  getUserInfo(): Promise<any> {
    this.setDisplayingParameters(false);
    return this.perform('GET', '/userInfo');
  }

  logout(): Promise<void> {
    this.setDisplayingParameters(true);
    return this.perform('POST', '/logout');
  }
}
