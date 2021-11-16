import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { GeneralSetting } from './genralSetting.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VerifoneService {

  constructor(private http: HttpClient) { }

  public increasePaymentCounter() {
    let currentCounter = GeneralSetting.getVerifonePaymentCounter() == "" ? 1 : Number(GeneralSetting.getVerifonePaymentCounter());

    currentCounter = currentCounter + 1;

    GeneralSetting.setVerifonePaymentCounter(currentCounter);

    return currentCounter;
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message);
  }

  connectAndRegisterVerifoneClient(body: any) {
    return this.http
      .post(environment.NodeUrl + 'verifoneRegisterDevice', body)
      .pipe(catchError(this.errorHandler));
  }

  testMac() {

    const currentCounter = this.increasePaymentCounter();

    const body = {
      message: GeneralSetting.getVerifoneDecryptedMessage(),
      counter: currentCounter,
      macLable: GeneralSetting.getVerifoneMacLabel()
    };

    return this.http.post<any>(environment.NodeUrl + 'testMacVerifone', body)
      .pipe(catchError(this.errorHandler));
  }

  startSession(invoiceNo:string) {
    const currentCounter = this.increasePaymentCounter();

    const body = {
      message: GeneralSetting.getVerifoneDecryptedMessage(),
      counter: currentCounter,
      macLable: GeneralSetting.getVerifoneMacLabel(),
      Invoice: invoiceNo,
      posIp: GeneralSetting.getVerifonePosIp()
    };

    return this.http
      .post<any>(environment.NodeUrl + 'doStartVerifoneSession', body)
      .pipe(catchError(this.errorHandler));
  }

  doOfflineTransaction(amount: string) {
    const currentCounter = this.increasePaymentCounter();

    const body = {
      message: GeneralSetting.getVerifoneDecryptedMessage(),
      counter: currentCounter,
      macLable: GeneralSetting.getVerifoneMacLabel(),
      amount: amount
    };

    return this.http
      .post<any>(environment.NodeUrl + 'doVerifoneTransaction', body)
      .pipe(catchError(this.errorHandler));
  }

  finishSession() {
    const currentCounter = this.increasePaymentCounter();

    const body = {
      message: GeneralSetting.getVerifoneDecryptedMessage(),
      counter: currentCounter,
      macLable: GeneralSetting.getVerifoneMacLabel()
    };

    return this.http
      .post<any>(environment.NodeUrl + 'doEndVerifoneSession', body)
      .pipe(catchError(this.errorHandler));
  }

  getCounter() {

    return this.http
      .post<any>(environment.NodeUrl + 'doVerifoneCounter', '')
      .pipe(catchError(this.errorHandler));
  }


}
