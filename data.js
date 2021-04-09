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
		write: (buf, data) => {
			buf.writeUInt8(data.length)
			Buffer.from(data).copy(buf, 1);
		}, size: i,
	});
	types.set("buf" + i, {
		read: (buf) => buf.slice(1, buf.readUInt8() + 1),
		write: (buf, data) => {
			buf.writeUInt8(data.length)
			data.copy(buf, 1);
		}, size: i,
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

	find(call) {
		const buf = Buffer.alloc(this.blockSize + 4);
		let position = 0;
		while(fs.readSync(this.fd, buf, { position })) {
			if(call(this.unpack(buf))) return buf.readUInt8();
			position += this.blockSize + 4;
		}
	}

	unpack(buf) {
		const data = [buf.readUInt32BE()];
		let offset = 4;
		for(let i of this.scheme) {
			const type = types.get(i);
			data.push(type.read(buf.slice(offset, offset += type.size)));
		}
		return data;
	}

	each(call) { this.find(row => { call(row) }) }
	seek(id) { this.find(data => data[0] === id) }
	
	set(id, ...data) {
		const position = this.seek(id);
		const buf = Buffer.alloc(this.blockSize + 4);
		let offset = 4;
		buf.writeUInt32BE(id);
		for(let i = 0; i < this.scheme.length; i++) {
			const type = types.get(this.scheme[i]);
			const slice = buf.slice(offset, offset += type.size);
			type.write(slice, data[i]);
		}
		fs.writeSync(this.fd, buf, position);
	}

	get(id) {
		const buf = Buffer.alloc(this.blockSize);
		if(!fs.readSync(this.fd, buf, { position: this.seek(id) })) return null;
		return this.unpack(buf);
	}
}

module.exports = Database;
