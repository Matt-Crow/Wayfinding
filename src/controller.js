/*
The Controller class is used to store data, preventing the need for global variables.
It also serves to link all of the GUI elements together
It also takes a lot of code out of the main HTML file.
*/

import { Path, testStack, testMinHeap } from "./nodes/path.js";
import { QrCodeParams } from "./htmlInterface/qrCodes.js";
import { Graph } from       "./dataFormatting/graph.js";
import { DataSet } from "./importData.js";
import {
    Canvas,
    TextBox,
    UrlList,
    testLev
} from "./htmlInterface/elementInterfaces.js";

export class Controller{
    constructor(){
        // html elements
        this.canvas = null;
        this.start = null;
        this.end = null;
        this.pathButton = null;
		this.urlList = null;
        this.pathUrlElementId = null;

        // model elements
        this.currentPath = null;
        this.graph = new Graph();

		this.mode = "WAYFINDING";
    }

    /*
     * HTML element methods
     */

    /*
     * Adds an SVG element to the
     * element with the given id,
     * then creates a Canvas on that element,
     * allowing the class to render paths.
     */
	createCanvas(elementId){
        let svgElement = SVG(elementId).panZoom({zoomMin: 0.5, zoomMax: 5});
		this.canvas = new Canvas(svgElement);
	}

    /*
     * Creates a TextBox from the given elements.
     * The app uses these elements to read and display input.
     * Populates said TextBoxes with the labels from the imported graph when importDataSet is called.
     */
	createStartInputBox(inputBoxId, resultDisplayId){
		this.start = new TextBox(inputBoxId, resultDisplayId);
	}

    /*
     * Creates a TextBox from the given elements.
     * The app uses these elements to read and display input.
     * Populates said TextBoxes with the labels from the imported graph when importDataSet is called.
     */
	createEndInputBox(inputBoxId, resultDisplayId){
		this.end = new TextBox(inputBoxId, resultDisplayId);
	}

	/*
    Id is the id of any HTML element.
    When the given element is clicked,
    Updates the path based on what is entered in the input boxes
    */
    setPathButton(id){
		this.pathButton = document.getElementById(id);
		if(this.pathButton === null){
			throw new Error(`No element with an ID of ${id} exists.`);
		}

		this.pathButton.onclick = ()=>{
			this.updatePath();
		};
	}

	/*
     * Creates a UrlList,
     * which will update to show all
     * URLs associated with a path
     * when it updates
	*/
	createUrlList(elementId){
        this.urlList = new UrlList(elementId);
	}

    /*
     * Sets which element will display the URL for the current path
     */
    setUrlDisplay(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        this.pathUrlElementId = elementId;
    }

    /*
     * When the element with the given ID is clicked,
     * copies the path URL to the clipboard
     */
    setUrlCopyButton(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        e.onclick = ()=>{
            //https://css-tricks.com/native-browser-copy-clipboard/
            let range = document.createRange();
            range.selectNode(document.getElementById(this.pathUrlElementId));
            window.getSelection().addRange(range);
            try{
                document.execCommand("copy");
            }catch(ex){
                console.error(ex);
            }
            window.getSelection().removeAllRanges();
            alert("Copied link");
        };
    }

    /*
     * After calling this method,
     * when the element with the given ID is clicked,
     * downloads the current map as an SVG
     */
	setDownloadButton(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        e.onclick = ()=>{
            this.canvas.download(this.currentPath.getURL() + ".svg");
        };
    }

    /*
    Adds functionality to the input element with the given ID.
    When the user chooses a folder using this input element,
    populates the application with the wayfinding data in that folder.
    */
    addImportButton(elementId){
        let e = document.getElementById(elementId);
        if(e === null){
            throw new Error("Couldn't find element with ID " + elementId);
        }
        e.onchange = async ()=>{
            let dataSet = new DataSet();
            for(let file of e.files){
                console.log(file);
                if(file.name.endsWith("NodeCoords.csv")){
                    dataSet.nodeCoordFile = await file.text();
                } else if(file.name.endsWith("NodeConn.csv")){
                    dataSet.nodeConnFile = await file.text();
                } else if(file.name.endsWith("Labels.csv")){
                    dataSet.labelFile = await file.text();
                } else if(file.name.endsWith("png")){
                    dataSet.imageUrl = await URL.createObjectURL(file);
                }
            }
            this.importDataSet(dataSet);
        };
    }

    /*
     * Path related methods.
     */

	setPath(path){
        if(!path.valid){
            throw new Error("Invalid path: " + path);
        }
        this.currentPath = path;
        this.urlList.update(path);
        if(this.pathElementId !== null){
            document.getElementById(this.pathUrlElementId).innerText = path.getURL();
        }

        let bounds = path.calculateBounds();
        this.canvas.focusOn(bounds.maxX, bounds.maxY, bounds.minX, bounds.minY);
        path.draw(this.canvas);
    }

    /*
     * Updates the path to reflect the input of this' start and end input boxes
     */
	updatePath(){
        if(!this.start.isValid()){
            throw new Error("Invalid: " + this.start.getResult());
        }
        if(!this.end.isValid()){
            throw new Error("Invalid: " + this.end.getResult());
        }
        let start = this.getGraph().getIdByString(this.start.getResult());
        let end = this.getGraph().getIdByString(this.end.getResult());
        let newPath = new Path(start, end, this);
        this.setPath(newPath);
	}

	getGraph(){
		return this.graph;
	}

    //working here #######################################

    //move some of the stuff from importDataInto(master) to this
	async importDataSet(dataSet){
		/*
		Called after the initial import.
		Updates this' various components with the newly imported data.

		1. Sets the size of the canvas
		2. Populates the TextBoxes
		3. Sets the default path
		*/
        const params = new QrCodeParams();
        this.mode = params.wayfindingMode;

        console.time("set image");
		await this.canvas.setImage(dataSet.imageUrl);
        console.timeEnd("set image");

        this.graph = Graph.fromDataSet(dataSet);
		await this.refresh();
	}

    async refresh(){
        const params = new QrCodeParams();

        const upperLeft = this.graph.getNode(-1);
		const lowerRight = this.graph.getNode(-2);

        let startId;
        let endId;

        this.start.addOptions(this.getGraph().getAllNames());
		this.end.addOptions(this.getGraph().getAllNames());

        if(params.startMode === QrCodeParams.ID_MODE){
            try {
                let names = this.graph.getLabelsForId(params.start);
                if(names.length > 0){
                    this.start.setInput(names[0]);
                }
            } catch(e){
                console.error(e);
            }
            startId = params.start;

        } else {
            startId = this.graph.getIdByString(params.start);
            this.start.setInput(params.start);
        }

        if(params.endMode === QrCodeParams.ID_MODE){
            try {
                let names = this.graph.getLabelsForId(params.end);
                if(names.length > 0){
                    this.end.setInput(names[0]);
                }
            } catch(e){
                console.error(e);
            }
            endId = params.end;
        } else {
            endId = this.graph.getIdByString(params.end);
            this.end.setInput(params.end);
        }

        //params.displayData();

		this.canvas.setCorners(
			upperLeft.x,
			upperLeft.y,
			lowerRight.x,
			lowerRight.y
		);

        try {
    		this.setPath(new Path(
    			startId,
    			endId,
    			this
    		));
        } catch(ex){
            console.error(ex);
        }

		if(params.devMode){
			this.addDevTools();
			console.log("adding dev");
		}
        this.graph.drawAll(this.canvas);
        console.log("done refreshing");
    }



    /*
    Testing methods
    */

    addDevTools(){
		/*
		Adds divs to to webpage which will allow
		us to test various features
		*/
		function addTool(text, onclick){
			let element = document.getElementById(text);
			if(element === null){
				element = document.createElement("div");
				element.setAttribute("id", text);
				document.body.appendChild(element);
			}
			element.onclick = onclick;
			element.innerHTML = text;
		}
		let self = this;
		addTool("Test all paths", ()=>self.testAllPaths());
		addTool("Test levenshtine", ()=>testLev());
        addTool("Test stack", ()=>testStack());
        addTool("Test min heap", ()=>testMinHeap());
	}

	testAllPaths(){
		//developer tool. Detects any paths between any two nodes that cannot exist

		let source = this;
		let graph = source.getGraph();

		let points = graph.getAllNames();

		function checkPath(startStr, endStr){
			try{
				let id1 = graph.getIdByString(startStr);
				let id2 = graph.getIdByString(endStr);

				//getIdByString will log any errors
				if(id1 != null && id2 != null){
					let path = new Path(id1, id2, source);
					if(!path.valid){
						throw new Error("Invalid Path: " + path);
					}
				}
			} catch(e){
				console.log(e.stack);
			}
		}

		alert("Please wait while I process " + (points.length * points.length) + " paths...");
		for(let i = 0; i < points.length; i++){
			for(let j = 0; j < points.length; j++){
				checkPath(points[i], points[j]);
			}
		}
		alert("Done.");
	}
};
