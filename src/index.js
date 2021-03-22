import {Controller} from "./controller.js";
import {importDataInto} from "./importData.js";

function init(){
	console.time("Time to load (wayfinding)");

	let application = new Controller();
    application.createCanvas("wrapper");
	application.createStartInputBox("start box", "start hint");
    application.createEndInputBox("end box", "end hint");
    application.setPathButton("button");
	application.createUrlList("moreInfo");
    application.setUrlDisplay("currUrl");
    application.setUrlCopyButton("copyUrl");
    application.setDownloadButton("downloadSvg");
	application.addImportButton("dataSetUpload");

	importDataInto(application).then((responses)=>{
		console.timeEnd("Time to load (wayfinding)");
	}).catch((err)=>{
		console.error("Failed to import data:");
		console.error(err);
	});
}

init();
