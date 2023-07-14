import React, { useEffect, useState } from 'react'
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

const FileUpload = () => {

    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("");

    const [parseData, setParseData] = useState(<></>)
    const [isLoading, setIsLoading] = useState(false)

    const saveFile = (e) => {
        setFile(URL.createObjectURL(e.target.files[0]));
        setFileName(e.target.files[0].name);
        setParseData(<></>)
    };

    const decode = async () => {
        if (BlinkIDSDK.isBrowserSupported()) {
            const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings("MWY1N2U3MTg1M2JhNDQzNGFiZDBjYWI4M2VlMTk2MDM6NWExZjQ4ZWMtZmU1MC00N2U3LTk0NDEtN2Q1ODRkM2UzZGY4");
            
            loadSettings.allowHelloMessage = true;
            loadSettings.engineLocation = "https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.1.0/resources/";
            loadSettings.workerLocation = await getWorkerLocation('https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.1.0/resources/BlinkIDWasmSDK.worker.min.js');

            BlinkIDSDK.loadWasmModule(loadSettings)
                .then(
                    async (wasmSDK) => {
                        // The SDK was initialized successfully, save the wasmSDK for future use
                        const recognizer = await BlinkIDSDK.createBlinkIdSingleSideRecognizer(wasmSDK);
                        const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
                            wasmSDK,
                            [recognizer],
                            true
                        );

                        const imageElement = document.getElementById("img");
                        // imageElement.src = URL.createObjectURL(imageURL);
                        await imageElement.decode();

                        const imageFrame = BlinkIDSDK.captureFrame(imageElement);
                        const processResult = await recognizerRunner.processImage(imageFrame);

                        console.log('processResult', processResult);

                    },
                    (error) => {
                        // Error happened during the initialization of the SDK
                        console.log("Error during the initialization of the SDK!", error);
                    }
                )
        }
        else {
            console.log("This browser is not supported by the SDK!");
        }
    }

    return (
        <div className='d-flex flex-column items-center'>
            <div className="d-flex">
                <input type="file" onChange={saveFile} />
                <button onClick={decode}>Decode</button>
            </div>
            <img src={file} width={300} height={200} className='mt-30' id='img' />
            <div className='w-100 d-flex flex-column mt-30'>
                {parseData}
            </div>
        </div>

    );

}

export default FileUpload;