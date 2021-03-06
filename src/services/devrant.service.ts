import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { SetApiRequest } from 'src/service-worker/messages';
import { getWorker } from 'src/utils/workers';
import * as devRant from 'ts-devrant';
import debug from 'debug';
import { presentGenericAlert } from 'src/utils/alert-utils';
import { environment } from '../environments/environment';
import { AppService } from './app.service';
import { ConfigService } from './config.service';

const log = debug('dr:service:devrant');

devRant.updateConfig({
  "api": environment.apiURL,
})

@Injectable({
  providedIn: 'root'
})
export class DevRantService {
  worker: ServiceWorker;

  async getUserIdByName(username) {
    return devRant.getIdByUsername(username)
  }

  async validateNotifications() {
    if (!this.isSignedIn) {
      return;
    }

    if (Notification.permission === 'default') {
      const alert = await this.alert.create({
        header: 'Notifications',
        subHeader: "To keep you updated, we need you to allow notifications.",
        message: "We will only push notifications related to devRant.",
        buttons: [
          "Ask me later",
          {
            text: "Sure!",
            handler: () => this.requestNotifications()
          }
        ]
      })

      alert.present();
    }
  }

  async requestNotifications() {
    const confirmed = await Notification.requestPermission()
    if (confirmed === "granted") {
      const notification = new Notification("Thanks for confirming!", {
        body: "This is how a notification could look like.",
        icon: '/assets/icons/icon-128x128.png'
      })
    } else if (confirmed === "denied") {
      const quirky = await this.alert.create({
        header: "Bipolar feelings?",
        subHeader: "We won't ask you again",
        message: "If you changed your mind, you can change this in your browser settings.",
        buttons: ["OK"]
      })

      quirky.present()
    }
  }

  private _token: devRant.Token = null;

  private _profile?: devRant.Profile;

  get profile() {
    return this._profile;
  }

  get profileColor() {
    if (this.profile) {
      return `#${this.profile.avatar.b}`;
    }

    return null
  }

  constructor(
    private appService: AppService,
    private configService: ConfigService,
    private alert: AlertController,
    private router: Router
  ) {
    log('init');
    this.setupService();
    log('connector', devRant)
  }

  async setupService() {
    const token = JSON.parse(localStorage.getItem('token'))
    await this.setupWorker()

    if (token) {
      this.token = token;
      this.getProfile();
    }
  }

  async setupWorker() {
    this.worker = await getWorker()
    this.worker.postMessage({
      type: 'setAPI',
      apiURL: environment.apiURL
    } as SetApiRequest)

    log('worker setup')
  }

  set token(newToken: devRant.Token) {
    this._token = newToken
    localStorage.setItem('token', JSON.stringify(newToken || null))

    this.worker.postMessage({
      type: 'newToken',
      token: this.token
    });

    this.validateNotifications();
  }

  get token() {
    return this._token
  }

  profileUpdated() {
    const ev = new CustomEvent('profile-updated');
    window.dispatchEvent(ev);

    this.updateBrowserTheme()
  }

  updateBrowserTheme() {
    const theme = document.head.querySelector('meta[theme-color]')
    if (theme) {
      theme.setAttribute('content', this.profileColor)
    }
  }

  async getProfile(userId?: string, content?: string, skip?: number) {
    // we need to have a token AND the SAME userId as in the token OR no id and we use the id in the token.
    if (this.token && (!userId || userId === String(this.token.user_id))) {
      const request = this.lazyUpdateProfile(content, skip);
      if (!this.profile) {
        await request;
      }

      return this._profile;
    } else {
      return this.fetchProfile(userId, content, skip);
    }
  }

  private async fetchProfile(userId?: string, content?: string, skip?: number) {
    const response = await devRant.profile(userId, content, skip, this.token);
    return response.profile;
  }

  async lazyUpdateProfile(content?: string, skip?: number) {
    this._profile = await this.fetchProfile(String(this.token.user_id), content, skip);
    this.profileUpdated()
  }

  async login(username: string, password: string) {
    const response = await devRant.login(username, password);

    if (!response.success) {
      throw new Error(response.error)
    }

    this.token = response.auth_token
    this.profileUpdated()
    return response.auth_token;
  }

  get isSignedIn() {
    return !!this.token;
  }

  async vote(vote: devRant.VoteState, rantId: number) {
    const response = await devRant.vote(vote, rantId, this.token);
    return response.rant;
  }

  async voteComment(vote: devRant.VoteState, commentId: number) {
    const response = await devRant.voteComment(vote, commentId, this.token);
    return response.comment;
  }

  /**
   * Resolve a specific rant by it's `id`.
   * @param randId 
   */
  async getRant(randId: number) {
    return devRant.rant(randId, this.token);
  }

  async getComment(commentId: number) {
    return devRant.comment(commentId, this.token);
  }

  /**
   * Resolve multiple rants from the feed.
   * @
   * @param sort 
   * @param limit 
   * @param skip 
   */
  async getFeedRants(sort: devRant.Sort, limit: number, skip: number) {
    return devRant.rants(sort, limit, skip, null, this.token)
  }
}