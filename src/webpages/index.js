import {
	App
} from "../app.js";
import {
	importDataInto
} from "../getRequests/importData.js";

export function init(){
	console.time("Time to load (wayfinding)");

	let master = new App();
    master.createCanvas("wrapper");
	master.createStartInputBox("start box", "start hint");
    master.createEndInputBox("end box", "end hint");
    master.setPathButton("button");
	master.createUrlList("moreInfo");
    master.setUrlDisplay("currUrl");
    master.setUrlCopyButton("copyUrl");
    master.setDownloadButton("downloadSvg");
	master.addImportButton("dataSetUpload");

	importDataInto(master).then((responses)=>{
		console.timeEnd("Time to load (wayfinding)");
	});
}

init();
