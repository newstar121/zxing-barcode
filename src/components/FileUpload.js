import React, { useEffect, useState } from 'react'
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

const FileUpload = () => {

    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("");

    const [parseData, setParseData] = useState(<></>)
    const [isLoading, setIsLoading] = useState(false)

    let initialMessageEl = document.getElementById("msg");
    let progressEl = document.getElementById("load-progress");
    let scanImageElement = document.getElementById("target-image");
    let inputImageFile = document.getElementById("image-file");

    const saveFile = (e) => {
        setFile(URL.createObjectURL(e.target.files[0]));
        setFileName(e.target.files[0].name);
        setParseData(<></>)
    };

    useEffect(() => {
        initialMessageEl = document.getElementById("msg");
        progressEl = document.getElementById("load-progress");
        scanImageElement = document.getElementById("target-image");
        inputImageFile = document.getElementById("image-file");
        decode()
    }, [])

    const decode = async () => {
        if (BlinkIDSDK.isBrowserSupported()) {
            const apiKey = '1f57e71853ba4434abd0cab83ee19603'
            const apiSecret = '5a1f48ec-fe50-47e7-9441-7d584d3e3df8'
            // Base64.encode(apiKey+':'+apiSecret)
            const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings("sRwAAAYYcGRmNDE3LXR5a3Eub25yZW5kZXIuY29tLOZpvj5TcBKq2JAWVjqs5cfNl9ksiwEKpaMeTtO0M0qvYfuK0HzmNurNlnTBUL5E504ILw70D+L++l9cmR0NO0OY61b0Q7Dssk+PnyJslOuKDG70gPn6myOyOTzrl/S91zJxAMV/0ZasqDiVa51AweuSVPH25zpkGgd1LO0Wnxl/wh5voL94S6gHvfJKX6nx8tLq6BUVSa43b2whsc1xLosQqzI=");

            loadSettings.allowHelloMessage = true;
            loadSettings.loadProgressCallback = (progress) => { progressEl.value = progress };
            loadSettings.engineLocation = "https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.1.0/resources/";
            loadSettings.workerLocation = await getWorkerLocation('https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.1.0/resources/BlinkIDWasmSDK.worker.min.js');

            BlinkIDSDK.loadWasmModule(loadSettings)
                .then(
                    (sdk) => {
                        document.getElementById("screen-initial")?.classList.add("hidden");
                        document.getElementById("screen-start")?.classList.remove("hidden");
                        document
                            .getElementById("image-file")
                            ?.addEventListener("change", (ev) => {
                                ev.preventDefault();
                                startScan(sdk, ev.target.files);
                            });
                    },
                    (error) => {
                        initialMessageEl.innerText = "Failed to load SDK!";
                        console.error("Failed to load SDK!", error);
                    }
                )
        }
        else {
            console.log("This browser is not supported by the SDK!");
        }
    }

    async function startScan(sdk, fileList) {
        document.getElementById("screen-start")?.classList.add("hidden");
        document.getElementById("screen-scanning")?.classList.remove("hidden");

        // 1. Create a recognizer objects which will be used to recognize single image or stream of images.
        //
        // BlinkID Single-side Recognizer - scan various ID documents
        const singleSideIDRecognizer = await BlinkIDSDK.createBlinkIdSingleSideRecognizer(sdk);

        // 2. Create a RecognizerRunner object which orchestrates the recognition with one or more
        //    recognizer objects.
        const recognizerRunner = await BlinkIDSDK.createRecognizerRunner
            (
                // SDK instance to use
                sdk,
                // List of recognizer objects that will be associated with created RecognizerRunner object
                [singleSideIDRecognizer],
                // [OPTIONAL] Should recognition pipeline stop as soon as first recognizer in chain finished recognition
                false
            );

        // 3. Prepare image for scan action - keep in mind that SDK can only process images represented in
        //    internal CapturedFrame data structure. Therefore, auxiliary method "captureFrame" is provided.

        // Make sure that image file is provided
        let file = null;
        const imageRegex = RegExp(/^image\//);
        for (let i = 0; i < fileList.length; ++i) {
            if (imageRegex.exec(fileList[i].type)) {
                file = fileList[i];
            }
        }
        if (!file) {
            alert("No image files provided!");
            // Release memory on WebAssembly heap used by the RecognizerRunner
            recognizerRunner?.delete();

            // Release memory on WebAssembly heap used by the recognizer
            singleSideIDRecognizer?.delete();
            inputImageFile.value = "";
            return;
        }
        const imageElement = new Image();
        const url = URL.createObjectURL(file);

        imageElement.src = url;
        scanImageElement.src = url;

        await imageElement.decode();
        const imageFrame = BlinkIDSDK.captureFrame(imageElement);
        URL.revokeObjectURL(url);

        // 4. Start the recognition and await for the results
        const processResult = await recognizerRunner.processImage(imageFrame);

        // 5. If recognition was successful, obtain the result and display it
        if (processResult !== BlinkIDSDK.RecognizerResultState.Empty) {
            const recognitionResults = await singleSideIDRecognizer.getResult();
            if (recognitionResults.state !== BlinkIDSDK.RecognizerResultState.Empty) {
                console.log("BlinkID SingleSide recognizer results", recognitionResults);

                let firstName = "";
                let lastName = "";
                let fullName = "";

                if (recognitionResults?.firstName && recognitionResults?.lastName) {
                    if (
                        typeof recognitionResults.firstName === "string" &&
                        typeof recognitionResults.lastName === "string"
                    ) {
                        firstName = recognitionResults.firstName;
                        lastName = recognitionResults.lastName;
                    } else {
                        firstName =
                            recognitionResults.firstName.latin ||
                            recognitionResults.firstName.cyrillic ||
                            recognitionResults.firstName.arabic;
                        lastName =
                            recognitionResults.lastName.latin ||
                            recognitionResults.lastName.cyrillic ||
                            recognitionResults.lastName.arabic;
                    }
                }

                if (recognitionResults?.fullName) {
                    if (recognitionResults.fullName?.latin && recognitionResults.fullName?.arabic) {
                        fullName = `${recognitionResults.fullName.latin} ${recognitionResults.fullName.arabic}`;
                    } else if (recognitionResults.fullName?.latin && recognitionResults.fullName?.cirilic) {
                        fullName = `${recognitionResults.fullName.latin} ${recognitionResults.fullName.cirilic}`
                    } else {
                        fullName =
                            recognitionResults.fullName.latin ||
                            recognitionResults.fullName.cyrillic ||
                            recognitionResults.fullName.arabic;
                    }
                }

                const derivedFullName = `${firstName} ${lastName}`.trim() || fullName

                let dateOfBirth = {
                    year: 0,
                    month: 0,
                    day: 0
                };

                if (recognitionResults?.dateOfBirth) {
                    dateOfBirth = {
                        year: recognitionResults.dateOfBirth.year || recognitionResults.mrz.dateOfBirth.year,
                        month: recognitionResults.dateOfBirth.month || recognitionResults.mrz.dateOfBirth.month,
                        day: recognitionResults.dateOfBirth.day || recognitionResults.mrz.dateOfBirth.day
                    }
                }

                alert
                    (
                        `Hello, ${derivedFullName}!\n You were born on ${dateOfBirth.year}-${dateOfBirth.month}-${dateOfBirth.day}.`
                    );
            }
        }
        else {
            alert("Could not extract information!");
        }

        // 7. Release all resources allocated on the WebAssembly heap and associated with camera stream

        // Release memory on WebAssembly heap used by the RecognizerRunner
        recognizerRunner?.delete();

        // Release memory on WebAssembly heap used by the recognizer
        singleSideIDRecognizer?.delete();

        // Hide scanning screen and show scan button again
        inputImageFile.value = "";
        scanImageElement.src = "";
        document.getElementById("screen-start")?.classList.remove("hidden");
        document.getElementById("screen-scanning")?.classList.add("hidden");
    }

    function getWorkerLocation(path) {
        return new Promise((resolve) => {
            window.fetch(path)
                .then(response => response.text())
                .then(data => {
                    const blob = new Blob([data], { type: "application/javascript" });
                    const url = URL.createObjectURL(blob);
                    resolve(url);
                });
        });
    }

    return (
        <div className='d-flex flex-column items-center'>
            {/* <div className="d-flex">
                <input type="file" onChange={saveFile} />
                <button onClick={decode}>Decode</button>
            </div>
            <img src={file} width={300} height={200} className='mt-30' id='img' />
            <div className='w-100 d-flex flex-column mt-30'>
                {parseData}
            </div> */}
            <div id="screen-initial">
                <h1 id="msg">Loading...</h1>
                <progress id="load-progress" value="0" max="100"></progress>
            </div>

            <div id="screen-start" className="hidden">
                <input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    capture="environment"

                />
                <label htmlFor="image-file">Scan from file</label>
                {/* <button onClick={decode}>Decode</button> */}
            </div>

            <div id="screen-scanning" className="hidden">
                <h1>Processing...</h1>
                <img id="target-image" />
            </div>
        </div>

    );

}

export default FileUpload;