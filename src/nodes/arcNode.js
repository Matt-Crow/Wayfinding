/*
Nodes are points on the ARC canvas.

See path.js for how the program uses these nodes, and scaledCanvas for how it uses the coordinates
*/
export class Node{
    constructor(id, x, y) {
        /*
		id is a unique identifier
        like a primary key

        x and y are coordinates on the map image,
		as extracted from the node spreadsheet.

        Each node has a series of connected nodes, but these are stored in graph
		*/

        try {
            this.id = parseInt(id);
            if (isNaN(this.id)) {
                throw new TypeError("Node id must be an integer");
            }
        } catch (idError) {
            console.log(idError.stack);
        }

        try {
            this.x = parseFloat(x);
            this.y = parseFloat(y);
            if (isNaN(this.x) || isNaN(this.y)) {
                throw new TypeError("X and Y must be numbers");
            }
        } catch (latLngError) {
            console.log(latLngError);
        }
    }

	distanceFrom(n2) {
		return Math.sqrt(
			Math.pow(this.x - n2.x, 2) + Math.pow(this.y - n2.y, 2)
		);
	}

	draw(canvas) {
		canvas.setColor("red");
		canvas.rect(this.x, this.y, 5, 5);
	}
	drawId(canvas){
		canvas.setColor("red");
		canvas.text(this.id, this.x, this.y);
	}
};
