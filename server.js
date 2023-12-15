const express = require("express");
const multer = require("multer");
const path = require("path");
const { Canvas, Image, loadImage } = require("canvas");
const faceapi = require("face-api.js");
const fs = require("fs");
const cors = require("cors");
require("@tensorflow/tfjs-node");
const tf = require("@tensorflow/tfjs-core");

faceapi.env.monkeyPatch({ Canvas, Image });

const app = express();
const port = 7000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.post("/uploads", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.json({ status: "error", message: "No file uploaded" });
  }
  const filePath = path.join("/uploads", req.file.filename);
  res.json({ status: "success", path: filePath });
});


app.get("/crop/:imageName", async (req, res) => {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, "models"));
    await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, "models"));

    const imagePath = path.join(__dirname, "uploads", req.params.imageName);
    const image = await loadImage(imagePath);
    const canvas = new Canvas(image.width, image.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);

    const detection = await faceapi.detectSingleFace(image).withFaceLandmarks();

    if (!detection) {
        return res.json({ status: "error", message: "Could not detect face" });
    }

    const leftEye = detection.landmarks.getLeftEye();
    const rightEye = detection.landmarks.getRightEye();

    ctx.fillStyle = "#FFF";

    const leftEyeCenter = {
      x: (leftEye[0].x + leftEye[3].x) / 2,
      y: (leftEye[1].y + leftEye[5].y) / 2
    };

    const leftEyeRadius = Math.hypot(leftEye[3].x - leftEye[0].x, leftEye[3].y - leftEye[0].y) / 2;

    ctx.beginPath();
    ctx.arc(leftEyeCenter.x, leftEyeCenter.y, leftEyeRadius, 0, Math.PI * 2);
    ctx.fill();

    const rightEyeCenter = {
      x: (rightEye[0].x + rightEye[3].x) / 2,
      y: (rightEye[1].y + rightEye[5].y) / 2
    };

    const rightEyeRadius = Math.hypot(rightEye[3].x - rightEye[0].x, rightEye[3].y - rightEye[0].y) / 2;

    ctx.beginPath();
    ctx.arc(rightEyeCenter.x, rightEyeCenter.y, rightEyeRadius, 0, Math.PI * 2);
    ctx.fill();

    const editedImageName = `edited_${req.params.imageName}`;
    const editedImagePath = path.join(__dirname, "uploads", editedImageName);
    const out = fs.createWriteStream(editedImagePath);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);
    out.on("finish", () => {
      res.json({ status: "success", path: `/uploads/${editedImageName}` });
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


// app.get("/crop/:imageName", async (req, res) => {
//   try {
//     await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, "models"));
//     await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, "models"));

//     const imagePath = path.join(__dirname, "uploads", req.params.imageName);
//     const image = await loadImage(imagePath);
//     const canvas = new Canvas(image.width, image.height);
//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(image, 0, 0, image.width, image.height);
    
//     const detection = await faceapi.detectSingleFace(image).withFaceLandmarks();

//     if (!detection) {
//         return res.json({ status: "error", message: "Could not detect face" });
//     }

//     const leftEye = detection.landmarks.getLeftEye();
//     const rightEye = detection.landmarks.getRightEye();

//     ctx.fillStyle = "#FFF";
//     ctx.fillRect(leftEye[0].x, leftEye[0].y, leftEye[3].x - leftEye[0].x, leftEye[5].y - leftEye[1].y);
//     ctx.fillRect(rightEye[0].x, rightEye[0].y, rightEye[3].x - rightEye[0].x, rightEye[5].y - rightEye[1].y);

//     const editedImageName = `edited_${req.params.imageName}`;
//     const editedImagePath = path.join(__dirname, "uploads", editedImageName);
//     const out = fs.createWriteStream(editedImagePath);
//     const stream = canvas.createJPEGStream();
//     stream.pipe(out);
//     out.on("finish", () => {
//       res.json({ status: "success", path: `/uploads/${editedImageName}` });
//     });
//   } catch (error) {
//     console.error("Error occurred:", error);
//     res.status(500).json({ status: "error", message: "Internal Server Error" });

//   }
// });


// app.get("/crop/:imageName", async (req, res) => {
//     console.log("jjjjjjjjjjj")
//     try {
//       await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, "models"));
//       await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, "models"));
  
//       const imagePath = path.join(__dirname, "uploads", req.params.imageName);
//       const image = await loadImage(imagePath);
//       const canvas = new Canvas(image.width, image.height);
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(image, 0, 0, image.width, image.height);
  
//       const detection = await faceapi.detectSingleFace(image).withFaceLandmarks();
  
//       if (!detection) {
//         return res.json({ status: "error", message: "Could not detect face" });
//       }
  
//       const landmarks = detection.landmarks;
//       const leftEyePoints = landmarks.getLeftEye();
//       const rightEyePoints = landmarks.getRightEye();
  
//       const eyePadding = 5; // Adjust padding as needed
//       const leftEyeBoundingRect = getBoundingRect(leftEyePoints, eyePadding);
//       const rightEyeBoundingRect = getBoundingRect(rightEyePoints, eyePadding);
  
//       // Create a new canvas for each eye
//       const leftEyeCanvas = new Canvas(leftEyeBoundingRect.width, leftEyeBoundingRect.height);
//       const leftEyeCtx = leftEyeCanvas.getContext("2d");
//       leftEyeCtx.drawImage(image, leftEyeBoundingRect.x, leftEyeBoundingRect.y, leftEyeBoundingRect.width, leftEyeBoundingRect.height, 0, 0, leftEyeBoundingRect.width, leftEyeBoundingRect.height);
  
//       const rightEyeCanvas = new Canvas(rightEyeBoundingRect.width, rightEyeBoundingRect.height);
//       const rightEyeCtx = rightEyeCanvas.getContext("2d");
//       rightEyeCtx.drawImage(image, rightEyeBoundingRect.x, rightEyeBoundingRect.y, rightEyeBoundingRect.width, rightEyeBoundingRect.height, 0, 0, rightEyeBoundingRect.width, rightEyeBoundingRect.height);
  
//       // Save the cropped eyes as files
//       const editedLeftEyeName = `edited_left_eye_${req.params.imageName}`;
//       const editedLeftEyePath = path.join(__dirname, "uploads", editedLeftEyeName);
//       const leftEyeStream = leftEyeCanvas.createJPEGStream();
//       leftEyeStream.pipe(fs.createWriteStream(editedLeftEyePath));
  
//       const editedRightEyeName = `edited_right_eye_${req.params.imageName}`;
//       const editedRightEyePath = path.join(__dirname, "uploads", editedRightEyeName);
//       const rightEyeStream = rightEyeCanvas.createJPEGStream();
//       rightEyeStream.pipe(fs.createWriteStream(editedRightEyePath));
  
//       res.json({ status: "success", leftEyePath: `/uploads/${editedLeftEyeName}`, rightEyePath: `/uploads/${editedRightEyeName}` });
//     } catch (error) {
//       console.error("Error occurred:", error);
//       res.status(500).json({ status: "error", message: "Internal Server Error" });
//     }
//   });
  
//   function getBoundingRect(points, padding) {
//     let minX = points[0].x;
//     let minY = points[0].y;
//     let maxX = points[0].x;
//     let maxY = points[0].y;
  
//     points.forEach((point) => {
//       if (point.x < minX) minX = point.x;
//       if (point.y < minY) minY = point.y;
//       if (point.x > maxX) maxX = point.x;
//       if (point.y > maxY) maxY = point.y;
//     });
  
//     minX -= padding;
//     minY -= padding;
//     maxX += padding;
//     maxY += padding;
  
//     return {
//       x: minX,
//       y: minY,
//       width: maxX - minX,
//       height: maxY - minY,
//     };
//   }
  

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

