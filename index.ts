import * as snmp from 'net-snmp';

enum OID {
	Name = '1.3.6.1.2.1.1.1.0',
	CurrentPowerState = '1.3.6.1.4.1.2699.2.4.1.4.2.0',
	PowerState = '1.3.6.1.4.1.2699.2.4.1.4.3.0',
	InputSource = '1.3.6.1.4.1.2699.2.4.1.6.1.1.3.1',
}

enum PowerState {
	On = 11,
	Off = 7,
	Save = 8,
	Cooling = 9,
	Warming = 10,
}

enum InputSource {
	HDMI1 = 5,
	HDMI2 = 14,
	HDMI3 = 17,
}

const ON_STATES = [PowerState.On, PowerState.Warming];

let Service, Characteristic;

class Projector {
	session: any;
	log: any;
	informationService: any;
	powerService: any;

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
		} catch (error) {
			this.log('SNMP Get Error', error);
			next(error);
		}
	}

	async setPowerState(on: boolean, next) {
		const nextPowerState = on ? PowerState.On : PowerState.Off;
		try {
			const powerState = await this.sendSnmp(OID.PowerState, nextPowerState)
			this.log('Set Power State', nextPowerState, 'current:', powerState);
			next();
		} catch (error) {
			this.log('SNMP Set Error', error);
			next(error);
		}
	}

	private async getSnmp(oid: OID) {
		return new Promise<any>((resolve, reject) => {
			this.session.get([oid], (error, varbinds) => {
				if (error) {
					reject(error);
				} else {
					resolve(varbinds[0].value.toString());
				}
			});
		});
	}

	private async sendSnmp(oid: OID, value: any) {
		const varbind = {
			oid,
			value,
			type: snmp.ObjectType.Integer,
		};

		return new Promise((resolve, reject) => {
			this.session.set([varbind], (error, varbinds) => {
				if (error) {
					reject(error);
				} else {
					resolve(varbinds[0].value.toString());
				}
			});
		});
	}
}

export = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-dell-projector', 'DellProjector', Projector);
}
