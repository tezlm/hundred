const EventEmitter = require("events");
const Keys = {
	up: Buffer.from([0x1B, 0x5B, 0x41]),
	down: Buffer.from([0x1B, 0x5B, 0x42]),
	right: Buffer.from([0x1B, 0x5B, 0x43]),
	left: Buffer.from([0x1B, 0x5B, 0x44]),
	left: Buffer.from([0x1B, 0x5B, 0x44]),
	tab: Buffer.from([0x07]),
	enter: Buffer.from([0x0A]),
	space: Buffer.from([0x20]),
};

function isPrint(char) {
	if(char >= 'a' && char <= 'z') return true;
	if(char >= 'A' && char <= 'Z') return true;
	if(char >= '0' && char <= '9') return true;
	if(char >= '[' && char <= '_') return true;
	if(char >= '{' && char <= '~') return true;
	return false;
}

class Input extends EventEmitter {
	constructor(stream) {
		super();
		stream.on("data", this.handle.bind(this));
		this.stream = stream;
	}

	handle(data) {
		for(let i in Keys) {
			if(data.equals(Keys[i])) this.emit(i);
		}
		const key = data.toString();
		if(isPrint(key)) this.emit(key);
		this.emit("data", data);
	}
	
	hijack() {
		this.stream.setRawMode(true);
	}

	close() {
		this.stream?.setRawMode(false);
	}
}

module.exports = Input;
