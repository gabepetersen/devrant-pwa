import { Component, ViewChild } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { DevRantService } from '@services/devrant.service';

@Component({
  selector: 'app-tab-profile',
  templateUrl: 'tab-profile.page.html',
  styleUrls: ['tab-profile.page.scss']
})
export class TabProfilePage {

  @ViewChild('username')
  username: HTMLIonInputElement;

  @ViewChild('password')
  password: HTMLIonInputElement;
  loginAlert: HTMLIonAlertElement;

  constructor(private readonly devrant: DevRantService, private readonly toast: ToastController, private readonly alert: AlertController) { }

  get isSignedIn() {
    return this.devrant.isSignedIn;
  }

  get userId() {
    return this.devrant.token.user_id;
  }

  async showSignIn() {
    const alert = await this.alert.create({
      header: 'Sign In',
      subHeader: 'We will never share your credentials.',
      inputs: [
        {
          name: 'username',
          placeholder: 'Username'
        },
        {
          name: 'password',
          placeholder: 'Password',
          type: 'password'
        }
      ],
      buttons: [{
        text: 'Sign In',
        handler: (data) => {
          this.onSignIn(data.username, data.password)
          return false;
        }
      }]
    })

    this.loginAlert = alert;

    alert.present();
  }

  async showSignUp() {
    const alert = await this.toast.create({
      header: 'Come back later for this feature.'
    })

    alert.present();
  }

  async onSignIn(username, password) {
    try {
      this.loginAlert.message = null
      await this.devrant.login(username, password);
      this.loginAlert.dismiss();
    } catch (e) {
      this.loginAlert.message = e.message
      const alertEl = this.loginAlert.querySelector('.alert-message') as HTMLDivElement
      alertEl.style.setProperty('--ion-text-color', 'var(--ion-color-danger)');
    }
  }

}
