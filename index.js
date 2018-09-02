"use strict";
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
const ON_STATES = [PowerState.On, PowerState.Warming];
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
    async getPowerState(next) {
        try {
            const powerState = await this.getSnmp(OID.PowerState);
            this.log('Power State', powerState);
            next(null, ON_STATES.includes(Number(powerState)) ? true : false);
        }
        catch (error) {
            this.log('SNMP Get Error', error);
            next(error);
        }
    }
    async setPowerState(on, next) {
        const nextPowerState = on ? PowerState.On : PowerState.Off;
        try {
            const powerState = await this.sendSnmp(OID.PowerState, nextPowerState);
            this.log('Set Power State', nextPowerState, 'current:', powerState);
            next();
        }
        catch (error) {
            this.log('SNMP Set Error', error);
            next(error);
        }
    }
    async getSnmp(oid) {
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
    }
    async sendSnmp(oid, value) {
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
    }
}
module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-dell-projector', 'DellProjector', Projector);
};
