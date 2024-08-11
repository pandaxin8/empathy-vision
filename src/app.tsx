import { Button, Rows, Text, Box, Switch } from "@canva/app-ui-kit";
import * as React from "react";
import { appProcess } from "@canva/platform";
import { useOverlay } from "utils/use_overlay_hook";
import { getTemporaryUrl, upload } from "@canva/asset";
import { addNativeElement, getCurrentPageContext } from "@canva/design";
import { useSelection } from "utils/use_selection_hook";
import styles from "styles/components.css";

// Main App component that decides which surface (Object Panel or Selected Image Overlay) to render
export function App() {
  const context = appProcess.current.getInfo();

  // Check if the current surface is the Object Panel
  if (context.surface === "object_panel") {
    return <ObjectPanel />;
  }

  // Check if the current surface is the Selected Image Overlay
  if (context.surface === "selected_image_overlay") {
    return <SelectedImageOverlay />;
  }

  // Handle unexpected surface types
  throw new Error(`Invalid surface: ${context.surface}`);
}

// Component for the Object Panel where users interact with the app
function ObjectPanel() {
  const overlay = useOverlay("image_selection");
  const [isImageReady, setIsImageReady] = React.useState(false);
  const [imageSelected, setImageSelected] = React.useState(false);
  const [isGrayscale, setIsGrayscale] = React.useState(false);
  const [isBlueYellow, setIsBlueYellow] = React.useState(false);
  const [isRedGreen, setIsRedGreen] = React.useState(false);

  // Listen for messages broadcasted from the overlay to check if the image is ready
  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      setIsImageReady(Boolean(message.isImageReady));
      setImageSelected(Boolean(message.isImageReady));
    });
  }, []);

  // Function to apply a global color blindness simulation overlay to the entire canvas
  const applyGlobalColorBlindnessOverlay = async () => {
    console.log("Applying global color blindness overlay...");

    const pageContext = await getCurrentPageContext();
    if (!pageContext?.dimensions) {
      console.error("Could not get page dimensions");
      return;
    }

    const { width, height } = pageContext.dimensions;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    context!.fillStyle = "rgba(128, 128, 128, 0.5)";
    context!.fillRect(0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/png");

    const asset = await upload({
      type: "IMAGE",
      mimeType: "image/png",
      url: dataUrl,
      thumbnailUrl: dataUrl,
    });

    await addNativeElement({
      type: "IMAGE",
      ref: asset.ref,
      width: width,
      height: height,
      top: 0,
      left: 0,
    });

    console.log("Color blindness overlay applied.");
  };

  // Function to broadcast a message to apply the blur effect to the selected image
  const applyBlur = () => {
    appProcess.broadcastMessage("applyBlur");
  };

  // Toggle functions for each type of color blindness
  const toggleGrayscale = () => {
    const newValue = !isGrayscale;
    setIsGrayscale(newValue);
    appProcess.broadcastMessage(newValue ? "applyGrayscale" : "removeGrayscale");
  };

  const toggleBlueYellow = () => {
    const newValue = !isBlueYellow;
    setIsBlueYellow(newValue);
    appProcess.broadcastMessage(newValue ? "applyBlueYellow" : "removeBlueYellow");
  };

  const toggleRedGreen = () => {
    const newValue = !isRedGreen;
    setIsRedGreen(newValue);
    appProcess.broadcastMessage(newValue ? "applyRedGreen" : "removeRedGreen");
  };

  // Function to open the image selection overlay
  const handleOpen = () => {
    overlay.open();
  };

  // Function to save and close the overlay after applying the simulation
  const handleSave = () => {
    overlay.close({ reason: "completed" });
  };

  // Function to close the overlay without saving changes
  const handleClose = () => {
    overlay.close({ reason: "aborted" });
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text size="medium" variant="bold">
          Visual Impairment Simulations
        </Text>
        <Text>Simulate different visual impairments on your design elements.</Text>

        {/* Image Selection Section */}
        <Box padding="2u">
          <Text size="small" variant="bold">Image Selection</Text>
          <Text>Please select or upload an image to start applying effects.</Text>
          <Button variant="secondary" disabled={!overlay.canOpen} onClick={handleOpen}>
            Select or Upload Image
          </Button>
        </Box>

        {/* Conditionally render the Apply Simulations Section */}
        {imageSelected && (
          <Box padding="2u">
            <Text size="small" variant="bold">Apply Simulations</Text>
            <Text>Choose an effect to apply to the selected image.</Text>
            
            <Switch 
              label="Grayscale" 
              value={isGrayscale} 
              onChange={toggleGrayscale} 
            />
            <Switch 
              label="Blue-Yellow" 
              value={isBlueYellow} 
              onChange={toggleBlueYellow} 
            />
            <Switch 
              label="Red-Green" 
              value={isRedGreen} 
              onChange={toggleRedGreen} 
            />
            
            <Button variant="secondary" disabled={!isImageReady} onClick={handleSave}>
              Save and Close
            </Button>
            <Button variant="secondary" disabled={!isImageReady} onClick={handleClose}>
              Close without Saving
            </Button>
          </Box>
        )}

        {/* Global Simulation Section */}
        <Box padding="2u">
          <Text size="small" variant="bold">Global Simulation</Text>
          <Text>Apply effects to the entire canvas.</Text>
          <Button variant="primary" onClick={applyGlobalColorBlindnessOverlay}>
            Apply Global Simulation
          </Button>
        </Box>

        {/* Reset Filters */}
        <Box padding="2u">
          <Button variant="primary" onClick={() => console.log("Reset Filters")}>
            Reset Filters
          </Button>
        </Box>
      </Rows>
    </div>
  );
}

// Component for the Selected Image Overlay where simulations are applied directly to the image
function SelectedImageOverlay() {
  const selection = useSelection("image");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = React.useRef<ImageData | null>(null);  // Store original image data

  React.useEffect(() => {
    const initializeCanvas = async () => {
      const draft = await selection.read();
      const [image] = draft.contents;

      if (!image) return;

      const { url } = await getTemporaryUrl({ type: "IMAGE", ref: image.ref });
      const img = await downloadImage(url);
      const { width, height } = img;

      const { canvas, context } = getCanvas(canvasRef.current);
      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, 0, 0, width, height);

      // Save the original image data for restoring later
      originalImageDataRef.current = context.getImageData(0, 0, width, height);

      appProcess.broadcastMessage({ isImageReady: true });
    };

    initializeCanvas();
  }, [selection]);

  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      if (message === "applyBlur") {
        applyBlurEffect(canvasRef.current);
      } else if (message === "applyGrayscale") {
        applyGrayscaleEffect(canvasRef.current);
      } else if (message === "removeGrayscale") {
        restoreOriginalImage(canvasRef.current, originalImageDataRef.current);
      } else if (message === "applyBlueYellow") {
        applyBlueYellowEffect(canvasRef.current);
      } else if (message === "removeBlueYellow") {
        restoreOriginalImage(canvasRef.current, originalImageDataRef.current);
      } else if (message === "applyRedGreen") {
        applyRedGreenEffect(canvasRef.current);
      } else if (message === "removeRedGreen") {
        restoreOriginalImage(canvasRef.current, originalImageDataRef.current);
      }
    });
  }, []);

  React.useEffect(() => {
    return void appProcess.current.setOnDispose(async (context) => {
      if (context.reason === "completed") {
        const { canvas } = getCanvas(canvasRef.current);
        const dataUrl = canvas.toDataURL();

        const asset = await upload({
          type: "IMAGE",
          mimeType: "image/png",
          url: dataUrl,
          thumbnailUrl: dataUrl,
        });

        const draft = await selection.read();
        draft.contents[0].ref = asset.ref;
        await draft.save();

        appProcess.broadcastMessage({ isImageReady: false });
      }
    });
  }, [selection]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

// Helper function to download an image
async function downloadImage(url: string) {
  const response = await fetch(url, { mode: "cors" });
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("Image could not be loaded"));
    img.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);

  return img;
}

// Helper function to get the canvas and its 2D rendering context
function getCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    throw new Error("HTMLCanvasElement does not exist");
  }

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("CanvasRenderingContext2D does not exist");
  }

  return { canvas, context };
}

// Function to apply a blur effect to the image
function applyBlurEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.filter = "blur(5px)";
  context.drawImage(canvas, 0, 0);
}

// Function to apply a grayscale effect (simulating complete color blindness) to the image
function applyGrayscaleEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.filter = "grayscale(100%)";
  context.drawImage(canvas, 0, 0);
}

// Function to apply a blue-yellow color blindness effect to the image using matrix transformation
function applyBlueYellowEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const imageData = context!.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const tritanopiaMatrix = [
    0.950, 0.050, 0.000,
    0.000, 0.433, 0.567,
    0.000, 0.475, 0.525,
  ];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i]     = tritanopiaMatrix[0] * r + tritanopiaMatrix[1] * g + tritanopiaMatrix[2] * b;
    data[i + 1] = tritanopiaMatrix[3] * r + tritanopiaMatrix[4] * g + tritanopiaMatrix[5] * b;
    data[i + 2] = tritanopiaMatrix[6] * r + tritanopiaMatrix[7] * g + tritanopiaMatrix[8] * b;
  }

  context!.putImageData(imageData, 0, 0);
}

// Function to apply a red-green color blindness effect to the image using matrix transformation
function applyRedGreenEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const imageData = context!.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const protanopiaMatrix = [
    0.567, 0.433, 0.000,
    0.558, 0.442, 0.000,
    0.000, 0.242, 0.758,
  ];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i]     = protanopiaMatrix[0] * r + protanopiaMatrix[1] * g + protanopiaMatrix[2] * b;
    data[i + 1] = protanopiaMatrix[3] * r + protanopiaMatrix[4] * g + protanopiaMatrix[5] * b;
    data[i + 2] = protanopiaMatrix[6] * r + protanopiaMatrix[7] * g + protanopiaMatrix[8] * b;
  }

  context!.putImageData(imageData, 0, 0);
}

// Function to restore the original image
function restoreOriginalImage(canvas: HTMLCanvasElement | null, originalImageData: ImageData | null) {
  if (!canvas || !originalImageData) return;
  const context = canvas.getContext("2d");
  context!.putImageData(originalImageData, 0, 0);
}
