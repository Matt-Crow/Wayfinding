import {Controller} from "./controller.js";
import {QrCodeParams} from "./htmlInterface/qrCodes.js";
import {importDataInto, getLatestDataSet} from "./importData.js";

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

	getLatestDataSet(new QrCodeParams().wayfindingMode).then((dataSet)=>{
		application.notifyImportDone(dataSet);
		console.timeEnd("Time to load (wayfinding)");
	}).catch((err)=>{
		console.timeEnd("Time to load (wayfinding)");
		console.error("Failed to import data:");
		console.error(err);
	});
}

init();
