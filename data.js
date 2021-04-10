// by ZestyLemonade
const fs = require("fs");
const types = new Map();

types.set("int", {
	read: (buf) => buf.readUInt32BE(),
	write: (buf, data) => buf.writeUInt32BE(data),
	size: 4,
});

types.set("float", {
	read: (buf) => buf.readFloatBE(),
	write: (buf, data) => buf.writeFloatBE(data),
	size: 4,
});

types.set("double", {
	read: (buf) => buf.readDoubleBE(),
	write: (buf, data) => buf.writeDoubleBE(data),
	size: 8,
});

[16, 32, 64, 128, 256].forEach(i => {
	types.set("str" + i, {
		read: (buf) => buf.slice(1, buf.readUInt8() + 1).toString(),
		write: (buf, data) => buf.writeUInt8(data.length) && Buffer.from(data).copy(buf, 1),
		size: i,
	});
	types.set("buf" + i, {
		read: (buf) => buf.slice(1, buf.readUInt8() + 1),
		write: (buf, data) => buf.writeUInt8(data.length) && data.copy(buf, 1),
		size: i,
	});
});

class Database {
	constructor(file, scheme) {
		if (!fs.existsSync(file)) fs.writeFileSync(file, "");
		this.blockSize = 0;
		for (let i of scheme) {
			if (!types.has(i)) throw "invalid type";
			this.blockSize += types.get(i).size;
		}
		this.fd = fs.openSync(file, "r+");
		this.scheme = scheme;
	}

	find(id) {
		let position = 0;
		const buf = Buffer.alloc(4);
		while(fs.readSync(this.fd, buf, { position })) {
			if(buf.readUInt32BE() === id) return position;
			position += this.blockSize + 4;
		}
		return position;
	}

	unpack(buf) {
		const data = [buf.readUInt32BE()];
		let pos = 4;
		for(let i = 0; i < this.scheme.length; i++) {
			const type = types.get(this.scheme[i]);
			data.push(type.read(buf.slice(pos, pos + type.size)));
			pos += type.size;
		}
		return data;
	}

	set(id, ...data) {
		const position = this.find(id);
		const buf = Buffer.alloc(this.blockSize + 4);
		let pos = 4;
		buf.writeUInt32BE(id);
		for(let i = 0; i < data.length; i++) {
			const type = types.get(this.scheme[i]);
			type.write(buf.slice(pos, pos + type.size), data[i]);
			pos += type.size;
		}
		fs.writeSync(this.fd, buf, 0, { position });
	}

	get(id) {
		const position = this.find(id);
		const buf = Buffer.alloc(this.blockSize + 4);
		if(!fs.readSync(this.fd, buf, { position })) return null;
		return this.unpack(buf);
	}

	each(call) {
		let position = 0;
		const buf = Buffer.alloc(this.blockSize + 4);
		while(fs.readSync(this.fd, buf, { position })) {
			call(this.unpack(buf));
			position += this.blockSize + 4;
		}
	}
}

module.exports = Database;
