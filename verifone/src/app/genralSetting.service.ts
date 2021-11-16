
export class GeneralSetting
{

  static setVerifonePublicKey(data: any) {
    localStorage.setItem('verifonePublicKey', data);
  }

  static getVerifonePublicKey() {
    const data = localStorage.getItem('verifonePublicKey');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }

  static setVerifonePrivateKey(data: any) {
    localStorage.setItem('verifonePrivateKey', data);
  }

  static getVerifonePrivateKey() {
    const data = localStorage.getItem('verifonePrivateKey');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }

  static setVerifoneRegisterDevice(data: any) {
    localStorage.setItem('VerifoneRegisterDevice', data);
  }

  static getVerifoneRegisterDevice() {
    const data = localStorage.getItem('VerifoneRegisterDevice');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }

  static setVerifoneMacKey(data: any) {
    localStorage.setItem('VerifoneMacKey', data);
  }

  static getVerifoneMacKey() {
    const data = localStorage.getItem('VerifoneMacKey');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }


  static setVerifoneDecryptedMessage(data: any) {
    localStorage.setItem('VerifoneDecryptedMessage', data);
  }

  static getVerifoneDecryptedMessage() {
    const data = localStorage.getItem('VerifoneDecryptedMessage');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }

  static setVerifonePaymentCounter(data: any) {
    localStorage.setItem('VerifonePaymentCounter', data);
  }

  static getVerifonePaymentCounter() {
    const data = localStorage.getItem('VerifonePaymentCounter');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }

  static setVerifoneMacLabel(data: any) {
    localStorage.setItem('VerifoneMacLabel', data);
  }

  static getVerifoneMacLabel() {
    const data = localStorage.getItem('VerifoneMacLabel');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }

  static setVerifonePosIp(data: any) {
    localStorage.setItem('VerifonePosIp', data);
  }

  static getVerifonePosIp() {
    const data = localStorage.getItem('VerifonePosIp');

    if (data == undefined || data == 'undefined' || data == null) return '';

    return data.toString() ?? '';
  }


}
