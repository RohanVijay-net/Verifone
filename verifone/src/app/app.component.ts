import { Component } from '@angular/core';
import { Snackbar } from "./snackbar.service"
import { GeneralSetting } from "./genralSetting.service"
import { VerifoneService } from './verifone.service';
import * as CryptoJS from 'crypto-js';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'verifone';



}
