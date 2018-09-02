"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const snmp = require("net-snmp");
var OID;
(function (OID) {
    OID["Name"] = "1.3.6.1.2.1.1.1.0";
    OID["CurrentPowerState"] = "1.3.6.1.4.1.2699.2.4.1.4.2.0";
    OID["PowerState"] = "1.3.6.1.4.1.2699.2.4.1.4.3.0";
    OID["InputSource"] = "1.3.6.1.4.1.2699.2.4.1.6.1.1.3.1";
})(OID || (OID = {}));
var PowerState;
(function (PowerState) {
    PowerState[PowerState["On"] = 11] = "On";
    PowerState[PowerState["Off"] = 7] = "Off";
    PowerState[PowerState["Save"] = 8] = "Save";
    PowerState[PowerState["Cooling"] = 9] = "Cooling";
    PowerState[PowerState["Warming"] = 10] = "Warming";
})(PowerState || (PowerState = {}));
var InputSource;
(function (InputSource) {
    InputSource[InputSource["HDMI1"] = 5] = "HDMI1";
    InputSource[InputSource["HDMI2"] = 14] = "HDMI2";
    InputSource[InputSource["HDMI3"] = 17] = "HDMI3";
})(InputSource || (InputSource = {}));
let Service, Characteristic;
class Projector {
    constructor(log, config) {
        this.log = log;
        this.session = snmp.createSession(config.ip, 'private');
        this.log('Found session');
    }
    getServices() {
        const informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Dell')
            .setCharacteristic(Characteristic.Model, 'S718QL')
            .setCharacteristic(Characteristic.SerialNumber, '12345');
        const powerService = new Service.Switch('Projector Power');
        powerService.getCharacteristic(Characteristic.On)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));
        this.informationService = informationService;
        this.powerService = powerService;
        return [informationService, powerService];
    }
    getPowerState(next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const state = yield this.getSnmp(OID.PowerState);
                this.log('Power State', state);
                next(null, state == PowerState.On ? true : false);
            }
            catch (error) {
                this.log('SNMP Get Error', error);
                next(error);
            }
        });
    }
    setPowerState(on, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const state = yield this.sendSnmp(OID.PowerState, on ? PowerState.On : PowerState.Off);
                this.log('Set Power State', state);
                next(null, state == PowerState.On ? true : false);
            }
            catch (error) {
                this.log('SNMP Set Error', error);
                next(error);
            }
        });
    }
    getSnmp(oid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.session.get([oid], (error, varbinds) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(varbinds[0].value.toString());
                    }
                });
            });
        });
    }
    sendSnmp(oid, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const varbind = {
                oid,
                value,
                type: snmp.ObjectType.Integer,
            };
            return new Promise((resolve, reject) => {
                this.session.set([varbind], (error, varbinds) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(varbinds[0].value.toString());
                    }
                });
            });
        });
    }
}
module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-dell-projector', 'DellProjector', Projector);
};
