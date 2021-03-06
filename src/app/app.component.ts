import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { DevRantService } from 'src/services/devrant.service';
import { applyShadesTo, hexToHSL, makeShades, renderHex } from 'src/utils/color-utils';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private devrant: DevRantService,
    private router: Router,
    private alert: AlertController
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    const fl = 'devrant-pwa-first-load';
    const firstUsage = !localStorage.getItem(fl)

    if (firstUsage) {
      const firstUsageAlert = await this.alert.create({
        header: 'Unofficial App',
        backdropDismiss: false,
        cssClass: 'greetings-alert',
        subHeader: 'Thanks for using the UNOFFICIAL devRant PWA.',
        message: `devrant.app is an open source project created by 010001111 and is not officially supported by devrant.com!`,
        buttons: [
          'Continue',
          {
            text: "I know",
            handler: () => localStorage.setItem(fl, 'true')
          }
        ]
      })

      firstUsageAlert.present();
    }
  }

  @HostListener('window:internal-link', ['$event'])
  internalRedirect(ev: CustomEvent) {
    this.router.navigate([ev.detail])
  }

  @HostListener('window:profile-updated', ['$event'])
  profileUpdate() {
    const shades = makeShades(this.devrant.profileColor);
    applyShadesTo(document.documentElement, shades)
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
