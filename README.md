A homebridge plugin for controlling the power of a Dell Projector S718QL. It probably works for other versions that support the same SNMP operations, but I haven't tested it.

## Installation

```
> npm install -g homebridge-dell-projector-plugin
```

## Configuration

In your Homebridge configuration (usually `~/.homebridge/config.json`), add the following to your accessory definitions:

```
"accessories": [
	{
		"accessory": "DellProjector",
		"name": "Projector",
		"ip": "192.168.1.1"
	}
]
```
