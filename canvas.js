const block = "\u2580"
const nl = s => s.str.replace(/\n/g, `\n\x1b[${s.x + 1}G`)
const fmt = s => `\x1b[${Math.floor(s.y / 2) + 1};${s.x + 1}H${nl(s)}`;
class Color {
	static black = 0;
	static red = 1;
	static green = 2;
	static yellow = 3;
	static blue = 4;
	static purple = 5;
	static cyan = 6;
	static white = 7;
}

class Canvas {
	constructor(w, h) {
		if(h) this.rw = w, this.rh = h;
		this.strs = [];
		this.buffer = [];
		for(let i = 0; i < this.height; i++) this.buffer.push([]);
		this.clear();
		this.color = Color.black;
	}

	flush(clear = true) {
		let curtop = -1, curbot = -1;
		let runtop = true, runbot = true;
		let str = "\x1b[0;0H";
		for(let i = 0; i < this.height; i += 2) {
			for(let j = 0; j < this.width; j++) {
				const top = this.buffer[i][j], bottom = this.buffer[i + 1][j];
				const resumed = !(runtop || runbot);
				runtop = top !== -1, runbot = bottom !== -1;
				if(!(runtop || runbot)) continue;
				if(resumed) str += `\x1b[${i / 2 + 1};${j + 1}H`;
				if(top !== curtop) {
					str += `\x1b[3${top === -1 ? 0 : top}m`;
					curtop = top;
				}
				if(bottom !== curbot) {
					str += `\x1b[4${bottom === -1 ? 0 : bottom}m`;
					curbot = bottom;
				}
				str += block;
			}
		}
		if(curtop !== -1 || curbot !== -1) str += "\x1b[0m";
		for(let i of this.strs) str += fmt(i);
		process.stdout.write(str);
		if(clear) this.clear();
	}

	clear() {
		for(let i = 0; i < this.height; i++) {
			for(let j = 0; j < this.width; j++) {
				this.buffer[i][j] = -1;
			}
		}
		while(this.strs.length) this.strs.pop();
	}
	
	pixel(x, y) {
		this.buffer[y][x] = this.color;
	}
	
	rect(x, y, w, h) {
		for(let i = y; i < y + h; i++) {
			for(let j = x; j < x + w; j++) {
				this.buffer[i][j] = this.color;
			}
		}
	}

	text(str, x, y) {
		this.strs.push({ str, x, y });
	}

	canvas(c, x, y, flush = true) {
		for(let i = 0; i < c.height; i++) {
			for(let j = 0; j < c.width; j++) {
				if(c.buffer[i][j] !== -1) this.buffer[i + y][j + x] = c.buffer[i][j];
			}
		}
		for(let i of c.strs) this.strs.push({ str: i.str, x: i.x + x, y: i.y + y });
		if(flush) c.clear();
	}

	get width() {
		return this.rw ? this.rw : process.stdout.columns;
	}

	get height() {
		return this.rh ? this.rh : process.stdout.rows * 2;
	}

	static color = Color; 
}

module.exports = Canvas;
