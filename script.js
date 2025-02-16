import {
    distanceBetweenPoints,
    findMidPoint,
    disposeMesh,
    checkAndShowVisualisation,
    getLandmarkFromName,
    torsoScalingFactor,
    calculateAngle,
    pauseMeshRotation,
} from "./utils.js";

var loadedMesh;
function initializeScene(canvasElement) {
    const engine = new BABYLON.Engine(canvasElement, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // scene.debugLayer.show(); //- Display babylonJS DebugLayer

    new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, 0), scene);
    new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

    // loading the glb file
    BABYLON.SceneLoader.ImportMesh("", "./models/", "liver.glb", scene, function (newMeshes) {
        loadedMesh = newMeshes;
        // console.log(loadedMesh);
        loadedMesh[2].name = "liver";

        // remove the default cube
        let defaultCube = scene.getMeshByName("Cube");
        if (defaultCube) {
            disposeMesh(defaultCube);
        }
    });

    BABYLON.SceneLoader.ImportMesh("", "./models/", "skull.glb", scene, function (newMeshes) {
        loadedMesh = newMeshes;
        // console.log(loadedMesh);
        loadedMesh[1].name = "skull";

        let defaultCube = scene.getMeshByName("Cube");
        if (defaultCube) {
            disposeMesh(defaultCube);
        }
    });

    BABYLON.SceneLoader.ImportMesh("", "./models/", "ribcage.glb", scene, function (newMeshes) {
        loadedMesh = newMeshes;
        // console.log(loadedMesh);
        loadedMesh[1].name = "ribcage";

        let defaultCube = scene.getMeshByName("Cube");
        if (defaultCube) {
            disposeMesh(defaultCube);
        }
    });

    return scene;
}

// function to pause the rotation of the mesh that is caused by the dynamic position change

function liverPosition(landmarks, videoWidth, videoHeight) {
    if (!landmarks || !landmarks.length) {
        return;
    }
    const leftShoulder = getLandmarkFromName(landmarks, "LEFT_SHOULDER", videoWidth, videoHeight);
    const rightShoulder = getLandmarkFromName(landmarks, "RIGHT_SHOULDER", videoWidth, videoHeight);
    const leftHip = getLandmarkFromName(landmarks, "LEFT_HIP", videoWidth, videoHeight);
    const rightHip = getLandmarkFromName(landmarks, "RIGHT_HIP", videoWidth, videoHeight);

    const midShoulder = findMidPoint(leftShoulder, rightShoulder);
    const midHip = findMidPoint(leftHip, rightHip);

    const torsoLength = distanceBetweenPoints(midShoulder, midHip);
    const liverPosition = {
        x: 0.8 * midHip.x,
        y: midHip.y - torsoLength / 3,
    };
    return liverPosition;
}

const skullPosition = (landmarks, videoWidth, videoHeight) => {
    if (!landmarks || !landmarks.length) {
        return;
    }

    const mouthLeft = getLandmarkFromName(landmarks, "MOUTH_LEFT", videoWidth, videoHeight);
    const mouthRight = getLandmarkFromName(landmarks, "MOUTH_RIGHT", videoWidth, videoHeight);
    const leftShoulder = getLandmarkFromName(landmarks, "LEFT_SHOULDER", videoWidth, videoHeight);
    const rightShoulder = getLandmarkFromName(landmarks, "RIGHT_SHOULDER", videoWidth, videoHeight);

    const midMouth = findMidPoint(mouthLeft, mouthRight);
    const midShoulder = findMidPoint(leftShoulder, rightShoulder);

    const torsoLength = distanceBetweenPoints(midMouth, midShoulder);
    const skullCoordinates = {
        x: midMouth.x,
        y: midMouth.y + torsoLength / 3,
    };

    return skullCoordinates;
};

const ribCagePosition = (landmarks, videoWidth, videoHeight) => {
    if (!landmarks || !landmarks.length) {
        return;
    }

    const leftShoulder = getLandmarkFromName(landmarks, "LEFT_SHOULDER", videoWidth, videoHeight);
    const rightShoulder = getLandmarkFromName(landmarks, "RIGHT_SHOULDER", videoWidth, videoHeight);
    const leftHip = getLandmarkFromName(landmarks, "LEFT_HIP", videoWidth, videoHeight);
    const rightHip = getLandmarkFromName(landmarks, "RIGHT_HIP", videoWidth, videoHeight);

    const midShoulder = findMidPoint(leftShoulder, rightShoulder);
    const midHip = findMidPoint(leftHip, rightHip);

    const torsoLength = distanceBetweenPoints(midShoulder, midHip);
    const ribCageCoordinates = {
        x: midShoulder.x,
        y: midShoulder.y + torsoLength / 4,
    };

    return ribCageCoordinates;
};

function showLiver({ scene, canvas, video, result, viewport }) {
    checkAndShowVisualisation({ scene, canvas, video, result });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!result || !result.poseLandmarks || !result.poseLandmarks.length) {
        return;
    }
    let liverMesh = scene.getMeshByName("liver");
    if (!liverMesh) {
        return;
    }

    const liverPos = liverPosition(result.poseLandmarks, video.videoWidth, video.videoHeight);

    const vector = BABYLON.Vector3.Unproject(
        new BABYLON.Vector3(video.videoWidth - liverPos.x, liverPos.y, 1),
        video.videoWidth,
        video.videoHeight,
        BABYLON.Matrix.Identity(),
        viewport.getViewMatrix(),
        viewport.getProjectionMatrix()
    );

    // setting position and visibility of the mesh
    let liverCheck = document.getElementById("liver");
    if (liverCheck.checked) {
        liverMesh.isVisible = true;
    } else {
        liverMesh.isVisible = false;
    }
    liverMesh.position.x = vector.x / 110;
    liverMesh.position.y = vector.y / 110;

    // setting rotation of the mesh
    pauseMeshRotation(liverMesh);
    liverMesh.rotation.x = Math.PI / 2;
    liverMesh.rotation.y = Math.PI / 2;

    // dynamic scaling of the mesh
    const scale = torsoScalingFactor(result.poseLandmarks, video.videoWidth, video.videoHeight);
    liverMesh.scaling = new BABYLON.Vector3(scale / 3, scale / 3, scale / 3);

    //render the scene
    scene.render();
}

const showSkull = ({ scene, canvas, video, result, viewport }) => {
    checkAndShowVisualisation({ scene, canvas, video, result });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!result || !result.poseLandmarks || !result.poseLandmarks.length) {
        return;
    }
    let skullMesh = scene.getMeshByName("skull");
    if (!skullMesh) {
        return;
    }

    const skullPos = skullPosition(result.poseLandmarks, video.videoWidth, video.videoHeight);
    // console.log(skullPos);

    const vector = BABYLON.Vector3.Unproject(
        new BABYLON.Vector3(video.videoWidth - skullPos.x, skullPos.y, 1),
        video.videoWidth,
        video.videoHeight,
        BABYLON.Matrix.Identity(),
        viewport.getViewMatrix(),
        viewport.getProjectionMatrix()
    );

    // setting position and visibility of the mesh
    let skullCheck = document.getElementById("skull");
    if (skullCheck.checked) {
        skullMesh.isVisible = true;
    } else {
        skullMesh.isVisible = false;
    }
    skullMesh.position.x = vector.x / 100;
    skullMesh.position.y = vector.y / 100;

    // setting rotation of the mesh
    pauseMeshRotation(skullMesh);
    skullMesh.rotation.x = 0;
    skullMesh.rotation.y =
        (Math.PI * 3) / 4 +
        calculateAngle(
            getLandmarkFromName(result.poseLandmarks, "LEFT_EAR", video.videoWidth, video.videoHeight),
            getLandmarkFromName(result.poseLandmarks, "NOSE", video.videoWidth, video.videoHeight),
            getLandmarkFromName(result.poseLandmarks, "RIGHT_EAR", video.videoWidth, video.videoHeight)
        ) /
            75;
    skullMesh.rotation.z = 0;

    // dynamic scaling of the mesh
    const scale = torsoScalingFactor(result.poseLandmarks, video.videoWidth, video.videoHeight);
    skullMesh.scaling = new BABYLON.Vector3(scale / 4, scale / 4, scale / 4);

    //render the scene
    scene.render();
};

const showRibCage = ({ scene, canvas, video, result, viewport }) => {
    checkAndShowVisualisation({ scene, canvas, video, result });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (!result || !result.poseLandmarks || !result.poseLandmarks.length) {
        return;
    }

    const ribCageMesh = scene.getMeshByName("ribcage");
    if (!ribCageMesh) {
        return;
    }

    const ribCagePos = ribCagePosition(result.poseLandmarks, video.videoWidth, video.videoHeight);

    const vector = BABYLON.Vector3.Unproject(
        new BABYLON.Vector3(video.videoWidth - ribCagePos.x, ribCagePos.y, 1),
        video.videoWidth,
        video.videoHeight,
        BABYLON.Matrix.Identity(),
        viewport.getViewMatrix(),
        viewport.getProjectionMatrix()
    );

    let ribCageCheck = document.getElementById("ribcage");
    if (ribCageCheck.checked) {
        ribCageMesh.isVisible = true;
    } else {
        ribCageMesh.isVisible = false;
    }
    ribCageMesh.position.x = vector.x / 100;
    ribCageMesh.position.y = vector.y / 100;

    pauseMeshRotation(ribCageMesh);
    ribCageMesh.rotation.x = Math.PI / 2;
    ribCageMesh.rotation.y = 0;
    ribCageMesh.rotation.z = 0;

    const scale = torsoScalingFactor(result.poseLandmarks, video.videoWidth, video.videoHeight);
    ribCageMesh.scaling = new BABYLON.Vector3(scale * 4, scale * 4, scale * 4);

    scene.render();
};

async function initialize() {
    const canvas = document.getElementById("renderCanvas"); // Get the canvas element
    const video = document.getElementById("input_video");
    if (!video || !canvas) {
        // setTimeout(initialize, 1000);
        return;
    }

    // initialize the babylon scene
    const scene = initializeScene(canvas);
    const viewport = scene.activeCamera;
    viewport.position.z = -100;

    // loading and configuring the medipipe pose model
    const pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
    });
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    // setting the camera and sending the video frame to the pose model
    let camera = new Camera(video, {
        onFrame: async () => await pose.send({ image: video }),
        width: window.innerWidth,
        height: window.innerHeight,
        facingMode: "environment",
    });
    camera.start();

    pose.onResults((result) => {
        showLiver({ scene, canvas, video, result, viewport });
        showSkull({ scene, canvas, video, result, viewport });
        showRibCage({ scene, canvas, video, result, viewport });
    });
}

window.onload = initialize;