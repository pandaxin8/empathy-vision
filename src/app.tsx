import { Button, Rows, Text, Box, Switch, Slider, Accordion, AccordionItem, Tab, TabList, Tabs, TabPanels, TabPanel } from "@canva/app-ui-kit";
import * as React from "react";
import { appProcess } from "@canva/platform";
import { useOverlay } from "utils/use_overlay_hook";
import { getTemporaryUrl, upload } from "@canva/asset";
import { addNativeElement, getCurrentPageContext } from "@canva/design";
import { useSelection } from "utils/use_selection_hook";
import styles from "styles/components.css";
import { WbSunny, Brightness3, Cloud, Brightness6, NightsStay, BeachAccess, WbTwilight } from '@mui/icons-material';

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
  const selection = useSelection("image");
  const [isImageReady, setIsImageReady] = React.useState(false);
  const [imageSelected, setImageSelected] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [isGrayscale, setIsGrayscale] = React.useState(false);
  const [isBlueYellow, setIsBlueYellow] = React.useState(false);
  const [isRedGreen, setIsRedGreen] = React.useState(false);
  const [blurLevel, setBlurLevel] = React.useState(0);
  const [condition, setCondition] = React.useState<string | null>(null);
  const [personality, setPersonality] = React.useState(0); 
  const [showSimulations, setShowSimulations] = React.useState(false);


  const descriptions = ["Select a character! Each one sees the world differently.", 
    "Chad is 6ft tall and plays rugby. Unbeknowest to his friends he can't see very well without glasses.", 
  "Professor Xavier teaches quantum physics by day but has difficulty seeing at night.",
"Sonic is a ball of energy and sees the world in different colors.",
"Custom Presets: Coming Soon!", "Custom Presets: Coming Soon!", "Custom Presets: Coming Soon!"]; 

  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      setIsImageReady(Boolean(message.isImageReady));
      setImageSelected(Boolean(message.isImageReady));
    });
  }, []);

  React.useEffect(() => {
    const checkImageSelection = async () => {
        const draft = await selection.read();
        const [image] = draft.contents;
        if (image) {
            setImageSelected(true);
        } else {
            setImageSelected(false);
            setShowSimulations(false); // Hide simulations when image is deselected
        }
    };
    checkImageSelection();
}, [selection]);


const togglePeronsality = (newPersonality: number) => {
  if (newPersonality === 6) {
    alert("Custom presets are coming soon!");
    return;
  }
  if (personality == newPersonality)
    setPersonality(0); 
  else 
    setPersonality(newPersonality); 
}

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setImagePreviewUrl(previewUrl);  // Set the preview URL
    }
  };

  const handleResetFilters = () => {
    setIsGrayscale(false);
    setIsBlueYellow(false);
    setIsRedGreen(false);
    setBlurLevel(0);
    setCondition(null);
  
    // Broadcast messages to remove all applied effects
    appProcess.broadcastMessage("removeGrayscale");
    appProcess.broadcastMessage("removeBlueYellow");
    appProcess.broadcastMessage("removeRedGreen");
    appProcess.broadcastMessage({ type: "applyBlur", level: 0 });
    appProcess.broadcastMessage({ type: "clearCondition" });
  };
  

  const handleFileUpload = async () => {
    if (file) {
      try {
        // Convert the file to a blob and then upload it
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          if (event.target?.result) {
            const image = await upload({
              type: "IMAGE",
              mimeType: file.type,
              url: event.target.result as string,
              thumbnailUrl: event.target.result as string,
            });
  
            setUploadedImageUrl(image.ref);
            setImageSelected(true);
            console.log("The asset reference is", image.ref);
            await image.whenUploaded();
            console.log("The upload is complete.");
          }
        };
        
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error("Error uploading the image: ", error);
      }
    }
  };
  
  const handleUseSelectedImage = async () => {
    overlay.open();
    const draft = await selection.read();
    const [image] = draft.contents;

    if (!image) return;

    const { url } = await getTemporaryUrl({ type: "IMAGE", ref: image.ref });
    setUploadedImageUrl(url);
    setImageSelected(true);
    setShowSimulations(true); // Show simulations when image is selected
    appProcess.broadcastMessage({ isImageReady: true });
};


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

  const updateBlurLevel = (level: number) => {
    setBlurLevel(level);
    appProcess.broadcastMessage({ type: "applyBlur", level });
  };

  const applyCondition = (newCondition: string) => {
    setCondition(newCondition);
    appProcess.broadcastMessage({ type: "applyCondition", condition: newCondition });
  };

  const clearCondition = () => {
    setCondition(null);
    appProcess.broadcastMessage({ type: "clearCondition" });
  };

  const applyGlobalSimulation = async () => {
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

  const handleOpen = () => {
    overlay.open();
  };

  const handleSave = () => {
    overlay.close({ reason: "completed" });
  };

  const handleClose = () => {
    overlay.close({ reason: "aborted" });
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text size="large" variant="bold">
          Visual Simulations
        </Text>
        <Text>Simulate different visual impairments and lighting conditions on your design elements.</Text>

        <Tabs>
          <Rows spacing="2u">
            <TabList>
              <Tab id="presets">
                Presets
              </Tab>
              <Tab id="settings">
                Settings
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel id="presets">
                <div className={styles.avatars}>
                  <img onClick={() => {toggleGrayscale(); togglePeronsality(1);}}  className={personality == 1 ? styles.selectedAvatar : styles.avatar} height="75" width="75" src="https://images.chesscomfiles.com/uploads/v1/user/377175819.9fbea89d.200x200o.6ce52fa7e4eb.png" />
                  <img onClick={() => {toggleRedGreen(); togglePeronsality(2);}}  className={personality == 2 ? styles.selectedAvatar : styles.avatar} height="75" width="75" src="https://images.chesscomfiles.com/uploads/v1/user/377175975.4af813a4.200x200o.09fcc1e6719f.png" />
                  <img onClick={() => {toggleBlueYellow(); togglePeronsality(3);}} className={personality == 3 ? styles.selectedAvatar : styles.avatar} height="75" width="75" src="https://images.chesscomfiles.com/uploads/v1/user/332157511.712395b1.200x200o.4bfb1275d9c0.jpg" />
                </div>
                <div className={styles.avatars}>
                  <img  className={personality == 4 ? styles.selectedAvatar : styles.avatar} onClick={() => { updateBlurLevel(10); togglePeronsality(4); }} height="75" width="75" src="https://images.chesscomfiles.com/uploads/v1/user/66746044.1de1e916.200x200o.cd0acd474c1b.png" />
                  <img className={personality == 5 ? styles.selectedAvatar : styles.avatar} onClick={() => { updateBlurLevel(10); togglePeronsality(5); }} height="75" width="75" src="https://images.chesscomfiles.com/uploads/v1/user/292909613.1affb03d.200x200o.234f24b2b551.png" />
                  <img className={personality == 6 ? styles.selectedAvatar : styles.avatar} onClick={() => { updateBlurLevel(10); togglePeronsality(6); }} height="75" width="75" src="https://i.pinimg.com/474x/5d/48/bd/5d48bdb21d142838e56e13046f802133.jpg" />
                </div>
                <Text>
                  {descriptions[personality]}
                </Text>
              </TabPanel>
              <TabPanel id="settings">
                <Box padding="3u">
                <Rows spacing="2u">
                <Text size="medium" variant="bold">Customisations</Text>
                <Text>Coming Soon!</Text>
                </Rows>
                </Box>
              </TabPanel>
            </TabPanels>
          </Rows>
        </Tabs>

        <Box padding="3u" border="standard" borderRadius="standard">
        <Rows spacing="2u">
          <Text size="medium" variant="bold">Image Selection</Text>
          <Text>Please select or upload an image to start applying effects.</Text>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <Button variant="secondary" onClick={handleFileUpload} disabled={!file}>
              Upload image
          </Button>
          <Button variant="secondary" disabled={!overlay.canOpen || !imageSelected} onClick={handleUseSelectedImage}>
              Use selected image
          </Button>
          </Rows>
      </Box>


        {imagePreviewUrl && (  // Render the image preview if the preview URL is set
          <Box padding="3u">
            <Text size="small" variant="bold">Image Preview</Text>
            <img src={imagePreviewUrl} alt="Preview" style={{ width: "100%", height: "auto" }} />
            <Button variant="primary" onClick={() => addImageToDesign(uploadedImageUrl)} disabled={!uploadedImageUrl}>
              Add to Design
            </Button>
          </Box>
        )}

        {showSimulations && imageSelected && (
          <Accordion>
            <AccordionItem title="Apply Simulations">
              <Text>Choose an effect to apply to the selected image.</Text>
              
              <Switch 
                label="Complete colour blindness" 
                value={isGrayscale} 
                onChange={toggleGrayscale} 
              />
              <Switch 
                label="Blue-Yellow colour blindness" 
                value={isBlueYellow} 
                onChange={toggleBlueYellow} 
              />
              <Switch 
                label="Red-Green colour blindness" 
                value={isRedGreen} 
                onChange={toggleRedGreen} 
              />
              <Box padding="3u">
                <Text size="small" variant="bold">Blurriness Level</Text>
                <Slider 
                  min={0} 
                  max={10} 
                  value={blurLevel} 
                  onChange={updateBlurLevel} 
                />
              </Box>
            </AccordionItem>

            <AccordionItem title="Simulate Time of Day">
              <Button variant={condition === "earlyMorning" ? "primary" : "secondary"} onClick={() => applyCondition("earlyMorning")}>
                <WbTwilight /> Early Morning
              </Button>
              <Button variant={condition === "morning" ? "primary" : "secondary"} onClick={() => applyCondition("morning")}>
                <WbSunny /> Morning
              </Button>
              <Button 
                variant={condition === "midday" ? "primary" : "secondary"} 
                onClick={() => applyCondition("midday")}
              >
                <Brightness6 /> Midday
              </Button>
              <Button 
                variant={condition === "afternoon" ? "primary" : "secondary"} 
                onClick={() => applyCondition("afternoon")}
              >
                <Brightness6 /> Afternoon
              </Button>
              <Button 
                variant={condition === "evening" ? "primary" : "secondary"} 
                onClick={() => applyCondition("evening")}
              >
                <NightsStay /> Evening
              </Button>
              <Button 
                variant={condition === "lateEvening" ? "primary" : "secondary"} 
                onClick={() => applyCondition("lateEvening")}
              >
                <Brightness3 /> Late Evening
              </Button>
              <Button variant="tertiary" onClick={clearCondition}>
                Clear Time of Day
              </Button>

            </AccordionItem>

            <AccordionItem title="Simulate Weather Conditions">
              <Button 
                variant={condition === "sunnyDay" ? "primary" : "secondary"} 
                onClick={() => applyCondition("sunnyDay")}
              >
                <WbSunny /> Sunny Day
              </Button>
              <Button 
                variant={condition === "gloomyDay" ? "primary" : "secondary"} 
                onClick={() => applyCondition("gloomyDay")}
              >
                <Cloud /> Gloomy Day
              </Button>
              <Button 
                variant={condition === "underStars" ? "primary" : "secondary"} 
                onClick={() => applyCondition("underStars")}
              >
                <BeachAccess /> Under the Stars
              </Button>
              <Button variant="tertiary" onClick={clearCondition}>
                Clear Weather Conditions
              </Button>

            </AccordionItem>
          </Accordion>
        )}

        {/* Global Simulation Section */}
        {/* <Box padding="2u">
          <Text size="small" variant="bold">Global Simulation</Text>
          <Text>Apply effects to the entire canvas.</Text>
          <Button variant="primary" onClick={applyGlobalSimulation}>
            Apply Global Simulation
          </Button>
        </Box> */}

        {/* Reset Filters */}
        <Box padding="3u" alignItems="center">
          <Button variant="primary" onClick={handleResetFilters} alignment="center">
            Reset Filters
          </Button>
        </Box>
      </Rows>
    </div>
  );
}

function SelectedImageOverlay() {
  const selection = useSelection("image");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const originalImageDataRef = React.useRef<ImageData | null>(null);

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

      originalImageDataRef.current = context.getImageData(0, 0, width, height);

      appProcess.broadcastMessage({ isImageReady: true });
    };

    initializeCanvas();
  }, [selection]);

  React.useEffect(() => {
    appProcess.registerOnMessage((sender, message) => {
      if (message.type === "applyBlur") {
        applyBlurEffect(canvasRef.current, message.level, originalImageDataRef.current);
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
      } else if (message.type === "applyCondition") {
        applyConditionEffect(canvasRef.current, message.condition, originalImageDataRef.current);
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

function applyBlurEffect(canvas: HTMLCanvasElement | null, level: number, originalImageData: ImageData | null) {
  if (!canvas || !originalImageData) return;
  const context = canvas.getContext("2d");

  restoreOriginalImage(canvas, originalImageData);

  context!.filter = `blur(${level}px)`;
  context!.drawImage(canvas, 0, 0);
}

function applyGrayscaleEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.filter = "grayscale(100%)";
  context.drawImage(canvas, 0, 0);
}

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

function applyConditionEffect(canvas: HTMLCanvasElement | null, condition: string, originalImageData: ImageData | null) {
  if (!canvas || !originalImageData) return;
  const context = canvas.getContext("2d");

  restoreOriginalImage(canvas, originalImageData);

  const imageData = context!.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (condition) {
    case "earlyMorning":
      applyBrightnessAndTint(data, -20, 10, 5, 0); // Slightly lower brightness, warm tint
      break;
    case "morning":
      applyBrightnessAndTint(data, 10, 5, 0, 0); // Slight increase in warmth
      break;
    case "midday":
      applyBrightnessAndTint(data, 20, 0, 0, 0); // High brightness, neutral tones
      break;
    case "afternoon":
      applyBrightnessAndTint(data, -10, 10, 0, 0); // Decreased brightness, warm tones
      break;
    case "evening":
      applyBrightnessAndTint(data, -20, 0, 0, 10); // Low brightness, cooler tones
      break;
    case "lateEvening":
      applyBrightnessAndTint(data, -30, 0, 0, 20); // Very low brightness, very cool tones
      break;
    case "sunnyDay":
      applyBrightnessAndContrast(data, 20, 20); // Increased brightness and contrast
      break;
    case "gloomyDay":
      applyBrightnessAndContrast(data, -20, -20); // Decreased brightness, lower contrast
      break;
    case "underStars":
      applyBrightnessAndTint(data, -50, 0, 0, 50); // Very low brightness, deep blue tones
      break;
    default:
      break;
  }

  context!.putImageData(imageData, 0, 0);
}

function applyBrightnessAndTint(data: Uint8ClampedArray, brightness: number, redTint: number, greenTint: number, blueTint: number) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(Math.max(data[i] + brightness + redTint, 0), 255);
    data[i + 1] = Math.min(Math.max(data[i + 1] + brightness + greenTint, 0), 255);
    data[i + 2] = Math.min(Math.max(data[i + 2] + brightness + blueTint, 0), 255);
  }
}

function applyBrightnessAndContrast(data: Uint8ClampedArray, brightness: number, contrast: number) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(Math.max(factor * (data[i] - 128) + 128 + brightness, 0), 255);
    data[i + 1] = Math.min(Math.max(factor * (data[i + 1] - 128) + 128 + brightness, 0), 255);
    data[i + 2] = Math.min(Math.max(factor * (data[i + 2] - 128) + 128 + brightness, 0), 255);
  }
}

function restoreOriginalImage(canvas: HTMLCanvasElement | null, originalImageData: ImageData | null) {
  if (!canvas || !originalImageData) return;
  const context = canvas.getContext("2d");
  context!.putImageData(originalImageData, 0, 0);
}

function addImageToDesign(imageRef: string | null) {
  if (!imageRef) return;

  // Try to download the image to get its original size
  downloadImage(imageRef).then((img) => {
    const originalWidth = img.width;
    const originalHeight = img.height;

    // Add the image to the design with its original dimensions
    addNativeElement({
      type: "IMAGE",
      ref: imageRef,
      width: originalWidth,
      height: originalHeight,
      top: 0,
      left: 0,
    }).then(() => {
      console.log("Image added to design at its original size.");
    });
  }).catch((error) => {
    console.error("Failed to download the image for size extraction:", error);
    // Fallback: Add the image with default dimensions
    addNativeElement({
      type: "IMAGE",
      ref: imageRef,
      width: 200, // Default width
      height: 200, // Default height
      top: 0,
      left: 0,
    }).then(() => {
      console.log("Image added to design with default size due to error.");
    });
  });
}

