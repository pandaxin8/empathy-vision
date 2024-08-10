import { Button, Rows, Text } from "@canva/app-ui-kit";
import * as React from "react";
import { appProcess } from "@canva/platform";
import { useOverlay } from "utils/use_overlay_hook";
import { getTemporaryUrl, upload } from "@canva/asset";
import { addNativeElement, getCurrentPageContext } from "@canva/design";
import { useSelection } from "utils/use_selection_hook";
import styles from "styles/components.css";

export function App() {
  const context = appProcess.current.getInfo();

  if (context.surface === "object_panel") {
    return <ObjectPanel />;
  }

  if (context.surface === "selected_image_overlay") {
    return <SelectedImageOverlay />;
  }

  throw new Error(`Invalid surface: ${context.surface}`);
}

function ObjectPanel() {
  const overlay = useOverlay("image_selection");
  const [isImageReady, setIsImageReady] = React.useState(false);
  const [showColorBlindnessOptions, setShowColorBlindnessOptions] = React.useState(false);
  const [showBlurrinessOptions, setShowBlurrinessOptions] = React.useState(false);

  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      setIsImageReady(Boolean(message.isImageReady));
    });
  }, []);

  const applyGlobalColorBlindnessOverlay = async () => {
    console.log("Applying global color blindness overlay...");

    const pageContext = await getCurrentPageContext();
    if (!pageContext?.dimensions) {
      console.error("Could not get page dimensions");
      return;
    }

    const { width, height } = pageContext.dimensions;

    // Create a new image element that will cover the entire canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    // Fill the canvas with a semi-transparent gray color
    context!.fillStyle = "rgba(128, 128, 128, 0.5)";
    context!.fillRect(0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/png");

    const asset = await upload({
      type: "IMAGE",
      mimeType: "image/png",
      url: dataUrl,
      thumbnailUrl: dataUrl,
    });

    // Add the new image element to the design
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

  const toggleColorBlindnessOptions = () => {
    setShowColorBlindnessOptions(!showColorBlindnessOptions);
  };

  const toggleBlurrinessOptions = () => {
    setShowBlurrinessOptions(!showBlurrinessOptions);
  };

  const resetFilters = () => {
    // Reset logic goes here
    console.log("Reset filters applied.");
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>Simulate different visual impairments.</Text>

        {/* Color Blindness Section */}
        <Button variant="secondary" onClick={toggleColorBlindnessOptions}>
          {showColorBlindnessOptions ? "Hide" : "Show"} Color Blindness Options
        </Button>
        {showColorBlindnessOptions && (
          <>
            <Button variant="primary" disabled={!overlay.canOpen} onClick={overlay.open}>
              Apply Simulation to Selected Image
            </Button>
            <Button variant="primary" onClick={applyGlobalColorBlindnessOverlay}>
              Apply Global Simulation
            </Button>
          </>
        )}

        {/* Blurriness Section */}
        <Button variant="secondary" onClick={toggleBlurrinessOptions}>
          {showBlurrinessOptions ? "Hide" : "Show"} Blurriness Options
        </Button>
        {showBlurrinessOptions && (
          <>
            <Button variant="primary" disabled={!isImageReady} onClick={() => appProcess.broadcastMessage("applyBlur")}>
              Apply Blurriness to Selected Image
            </Button>
          </>
        )}

        <Button variant="tertiary" onClick={resetFilters}>
          Reset Filters
        </Button>
      </Rows>
    </div>
  );
}

function SelectedImageOverlay() {
  const selection = useSelection("image");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

      appProcess.broadcastMessage({ isImageReady: true });
    };

    initializeCanvas();
  }, [selection]);

  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      if (message === "applyBlur") {
        applyBlurEffect(canvasRef.current);
      } else if (message === "applyColorBlindness") {
        applyColorBlindnessEffect(canvasRef.current);
      }
    });
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

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

function applyBlurEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.filter = "blur(5px)";
  context.drawImage(canvas, 0, 0);
}

function applyColorBlindnessEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.filter = "grayscale(100%)";
  context.drawImage(canvas, 0, 0);
}
