/*
Path is used to store a collection of Nodes that connect together
to form a path between two Nodes.

HOW A PATH IS FOUND:
1. Every Node has a list of Nodes that connect to it, called adjacent nodes.
2. If node A is adjacent to node B, then a path exists between them.
3. Similarly, if node B also connects to node C, then there exists a path A-B-C
4. Now, repeat this process until there exists a path between the start and end points given.
read this for a better explaination: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
*/

//use this in conjunction with Node
class Path{
    constructor(startId, endId, dataSource) {
        /*
        start and endId are node IDs
        dataSource is an Controller object

        nodePath is an array of nodes which serve as the vertexis of this path.
        pathLength is the total length of the distance between all the nodes used in the path
            it doesn't matter what scale it's in, as it is just used to compare in bestPath
        */

		this.mode = dataSource.mode;

        this.startId = parseInt(startId);
        this.endId = parseInt(endId);
        this.dataSource = dataSource;

        this.valid = true;

        this.nodePath = [];
        this.pathLength = 0;
        this.loadPath();
    }
	loadPath() {
		/*
		this is the big one.

		Dijkstra's algorithm.
		https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
		Thanks Kevin
		sets this.pathPath to shortest path when complete
		*/
        let debug = !false;

        if((this.startId < 0) || (this.endId < 0)){
			this.invalidate();
		}
        if(this.startId === this.endId){
			this.nodePath = [this.dataSource.getGraph().getNode(this.startId)];
			this.pathLength = 0;
			return;
        }

        // start by setting everything up
		let graph = this.dataSource.getGraph();
        //from and to are nodes
        function travelInfo(from, to){
            return {
                from: from,
                to: to,
                dist: from.distanceFrom(to),
                toString: function(){
                    return `From ${from.id} to ${to.id}: ${this.dist}`;
                }
            };
        }
        let travelLog = new Stack();
        let travelHeap = new MinHeap((ti1, ti2)=>ti1.dist < ti2.dist);
        let visited = new Map();
        let curr = graph.getNode(this.startId);
        let t = travelInfo(curr, curr);

        //find the path
        travelLog.push(t);
        visited.set(this.startId, true);
        while(curr.id !== this.endId){
            //get everything adjacent to curr
            graph.getIdsAdjTo(curr.id).forEach((nodeId)=>{
                if(!visited.has(nodeId)){
                    t = travelInfo(curr, graph.getNode(nodeId));
                    t.dist += travelLog.top.value.dist; //this is accumulated distance
                    travelHeap.siftUp(t);
                }
            });

            if(debug){
                console.log("After sifting up nodes adjacent to");
                console.log(curr);
                travelHeap.print();
            }

            do {
                t = travelHeap.siftDown();
                if(debug){
                    console.log(`Sifted down [${t.from.id} to ${t.to.id}: ${t.dist}]`);
                    console.log(t.to.id + " " + (visited.has(t.to.id)) ? "has" : "has not" + " already been visited.");
                }
            } while(visited.has(t.to.id));
            travelLog.push(t);
            curr = t.to;
            visited.set(curr.id, true);
            if(debug){
                console.log("Go to");
                console.log(curr);
                travelLog.print();
                console.log(visited);
            }
        }

        //backtrack to construct the path
        this.pathLength = travelLog.top.value.dist;

        //  accumulated distance
        let accumDist = this.pathLength;
        let reversed = new Stack();
        while(!travelLog.isEmpty() && curr.id !== this.startId){
            t = travelLog.pop();
            if(t.to === curr && Math.abs(t.dist - accumDist) < 0.001){
                reversed.push(t);
                curr = t.from;
                accumDist -= t.from.distanceFrom(t.to);
            }
        }

        this.nodePath = [graph.getNode(this.startId)];
        while(!reversed.isEmpty()){
            this.nodePath.push(reversed.pop().to);
        }

        if(this.startId !== this.nodePath[0].id || this.endId !== this.nodePath[this.nodePath.length - 1].id){
			this.invalidate();
		}
	}
	invalidate(){
		if(this.valid){
			//prevent doubling up on this message
			this.valid = false;
			try {
				console.log("Invalid path detected: ");
				console.log(this);
				throw new Error();
			} catch(e){
				console.log(e.stack);
			}
		}
	}
    /*
     * Used to find the smallest and largest
     * X and Y coordinates of any node in this path,
     * effectively creating a rectangle around the path.
     *
     * returns an object with the following properties:
     * -minX: the leftmost x coordinate of the rectangle
     * -maxX: the rightmost x coordinate of the rectangle
     * -minY: the topmost y coordinate of the rectangle
     * -maxY: the bottommost y coordinate of the rectangle
     */
    calculateBounds(){
        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = Number.MIN_VALUE;
        this.nodePath.forEach((node)=>{
            if(node.x < minX){
                minX = node.x;
            }
            if(node.x > maxX){
                maxX = node.x;
            }
            if(node.y < minY){
                minY = node.y;
            }
            if(node.y > maxY){
                maxY = node.y;
            }
        });
        return {
            "minX" : minX,
            "minY" : minY,
            "maxX" : maxX,
            "maxY" : maxY
        };
    }
	getURL() {
		let origURL = window.location.href;
		let split = origURL.split("?");
		return split[0] + "?startID=" + this.nodePath[0].id + "&endID=" + this.nodePath[this.nodePath.length - 1].id + "&mode=" + this.mode;
	}

	draw(canvas) {
		canvas.clear();
		canvas.setColor("red");

		let p = this.nodePath;
		p[0].draw(canvas);

		for (let i = 1; i < p.length; i++) {
			canvas.line(p[i-1].x, p[i-1].y, p[i].x, p[i].y);
			p[i].draw(canvas);
		}
	}
};

//these are used for Djdkstra's algorithm
class StackFrame{
    constructor(value){
        this.value = value;
        this.prev = null;
    }
}
class Stack{
    constructor(){
        this.top = null;
    }
    push(value){
        let newTop = new StackFrame(value);
        newTop.prev = this.top;
        this.top = newTop;
    }
    pop(){
        if(this.top === null){
            throw new Error("Nothing to pop");
        }
        let ret = this.top.value;
        this.top = this.top.prev;
        return ret;
    }
    isEmpty(){
        return this.top === null;
    }
    toString(){
        let ret = "Top of the stack\n";
        let curr = this.top;
        while(curr !== null){
            ret += (curr.value).toString() + "\n";
            curr = curr.prev;
        }
        ret += "Bottom of the stack";
        return ret;
    }
    print(){
        console.log(this.toString());
    }
}

class MinHeap{
    /*
     * Comparison function is used to compare
     * the values inserted into the Heap.
     * Given inputs A and B,
     * comparisonFunction(A, B) should return true
     * if B is "greater than" A, and thus should sink
     * lower into the heap.
     */
    constructor(comparisonFunction){
        this.firstEmptyIdx = 0;
        this.values = [];
        this.comparator = comparisonFunction;
    }

    siftUp(value){
        if(this.firstEmptyIdx === this.values.length){
            //need to make room for the new value
            this.values.push(" ");
        }
        this.values[this.firstEmptyIdx] = value;
        this.firstEmptyIdx++;

        //swap until the value is in its proper place
        let idx = this.firstEmptyIdx - 1;
        let parentIdx = Math.floor((idx - 1) / 2); //a heap is technically a binary tree.
        let temp;
        //                                                   child is less than parent, so swap
        while(parentIdx >= 0 && idx !== 0 && this.comparator(this.values[idx], this.values[parentIdx])){
            temp = this.values[idx];
            this.values[idx] = this.values[parentIdx];
            this.values[parentIdx] = temp;
            idx = parentIdx;
            parentIdx = Math.floor((idx - 1) / 2);
        }
    }

    siftDown(){
        if(this.isEmpty()){
            throw new Error("Nothing to sift down");
        }
        //return topmost item, delete it from heap, sift everything else back into position
        let ret = this.values[0];
        //last becomes first
        this.values[0] = this.values[this.firstEmptyIdx - 1];
        this.firstEmptyIdx--;

        let idx = 0;
        let left = 1;
        let right = 2;
        let temp;
        while(
            ((left < this.firstEmptyIdx && this.comparator(this.values[left], this.values[idx]))) ||
            ((right < this.firstEmptyIdx && this.comparator(this.values[right], this.values[idx])))
        ){
            if(this.comparator(this.values[left], this.values[right])){
                temp = this.values[left];
                this.values[left] = this.values[idx];
                this.values[idx] = temp;
                idx = left;
            } else {
                temp = this.values[right];
                this.values[right] = this.values[idx];
                this.values[idx] = temp;
                idx = right;
            }
            left = idx * 2 + 1;
            right = idx * 2 + 2;
        }
        return ret;
    }

    isEmpty(){
        return this.firstEmptyIdx === 0;
    }
    toString(){
        if(this.isEmpty()){
            return "Heap is empty";
        }
        let ret = "Heap:\n";
        let row = 0;
        let col = 0;
        let rowWidth = 1;
        ret += "    Row 0:\n";
        let nextRow = "        ";
        for(let i = 0; i < this.firstEmptyIdx; i++){
            nextRow += this.values[i].toString() + " | ";
            col++;
            if(col >= rowWidth && i < this.firstEmptyIdx - 1){
                row++;
                rowWidth *= 2;
                col = 0;
                ret += (nextRow) + "\n";
                nextRow = "        ";
                ret += ("    Row " + row + ":\n");
            }
        }
        ret += nextRow;
        return ret;
    }
    print(){
        console.log(this.toString());
        return;
        if(this.isEmpty()){
            return;
        }
        let row = 0;
        let col = 0;
        let rowWidth = 1;
        let nextRow = "        ";
        console.log("Heap:");
        console.log("    Row 0:");
        for(let i = 0; i < this.firstEmptyIdx; i++){
            nextRow += this.values[i] + " ";
            col++;
            if(col >= rowWidth && i < this.firstEmptyIdx - 1){
                row++;
                rowWidth *= 2;
                col = 0;
                console.log(nextRow);
                nextRow = "        ";
                console.log("    Row " + row + ":");
            }
        }
        console.log(nextRow);
    }
}

function testStack(){
    let vals = ["apple", "orange", "lemon", "lime", "blueberry"];
    let stack = new Stack();
    vals.forEach((val)=>stack.push(val));
    stack.print();
    while(!stack.isEmpty()){
        console.log("Popped " + stack.pop());
        stack.print();
    }
}
function testMinHeap(){
    let heap = new MinHeap((i, j)=>i < j);
    for(let i = 0; i < 10; i++){
        heap.siftUp(10 - i);
        heap.print();
    }
    while(!heap.isEmpty()){
        console.log("Sifted down " + heap.siftDown());
        heap.print();
    }
}

export {
    Path,
    Stack,
    MinHeap,
    testStack,
    testMinHeap
};
