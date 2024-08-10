# Empathy Vision: Visual Impairment and Accessibility Simulation Tool
## Overview
Empathy Vision is a comprehensive tool designed to simulate various visual impairments and accessibility challenges within Canva designs. This project leverages the Canva Apps SDK to provide an intuitive interface that helps designers apply effects like color blindness, blurriness, and low-light conditions to their work. The goal is to foster empathy and inclusivity by enabling designers to experience their designs as individuals with different visual impairments might.

## Features
### 1. Visual Impairment Simulations
- Color Blindness Simulation: Users can toggle simulations for different types of color blindness, including:
  - Red-Green Color Blindness: Simulates how users with red-green color blindness perceive colors.
  - Blue-Yellow Color Blindness: Simulates the perception of colors for users with blue-yellow color blindness.
- Blurriness Simulation: Apply a blur effect to mimic visual impairments like cataracts, allowing designers to see how clarity affects the user experience.
- Low-Light Simulations:
  - Adjust Brightness and Contrast: Simulate how designs appear under low-light conditions by adjusting brightness and contrast settings.
  - Apply Low Light Filter: Quickly apply a low-light filter to understand how designs are viewed in dim environments.

###  2. Accessibility Enhancements
- High Contrast Mode: Enable a high contrast mode to improve readability and usability for users with visual impairments.
- Night Mode Preview: Simulate how designs appear in night mode, ensuring that your designs are comfortable to view in dark settings.
- Visual Audio Waveform Representation: Provides a visual representation of audio elements, making it easier for users with hearing impairments to understand audio content.
- Captions/Subtitles for Video Elements: Ensure that video content is accessible by adding captions and subtitles, aiding users who are deaf or hard of hearing.
- Visual Alerts for Audio Cues: Implement visual alerts to accompany audio cues, providing a more inclusive experience for users with hearing impairments.

### 3. Interactive Image Overlay
- Real-Time Simulation: Select an image and apply simulations in real-time. Preview changes directly on the image before saving them.
- Save and Close: Save the applied effects and update the design with the changes.
- Close without Saving: Discard changes and keep the original design intact.

### 4. Global Simulations
- Apply Global Effects: Extend simulations like color blindness and low-light conditions across the entire canvas to assess the overall impact on the design.

### 5. Reset Filters
- Reset All Effects: Easily reset all applied effects to revert the design back to its original state, allowing for quick iterations and experimentation.

## How It Works
### Object Panel
The Object Panel serves as the main interface where users can:
- Select or Upload an Image: Choose or upload an image to apply visual impairment simulations.
- Apply Simulations: Once an image is selected, users can apply effects like blurriness, color blindness, and low-light simulations.
- Accessibility Enhancements: Activate features like high contrast mode, night mode preview, and captions for video elements.
- Global Simulations: Apply effects like color blindness across the entire canvas to understand the impact on the overall design.
- Reset Filters: Quickly reset all simulations and effects to return to the original design.

### Selected Image Overlay
The Selected Image Overlay provides a focused workspace where simulations are applied directly to the selected image. It includes:
- Real-Time Simulation: Users can see the effect of simulations such as blurriness, color blindness, and 0 brightness adjustments as they are applied to the image.
- Save Changes: Users can save changes, updating the image in the design with the applied effects.

## Implementation Details
### Tech Stack
- React: The app is built using React, ensuring a component-based architecture that is maintainable and scalable.
- Canva Apps SDK: Deep integration with Canva’s SDK allows for seamless image selection, manipulation, and asset management.
- Canvas API: Utilized for rendering and applying visual effects directly within the Canva editor.

### Key Components
- App Component: Determines the current surface (Object Panel or Selected Image Overlay) and renders the appropriate interface.
- Object Panel: The primary user interface for selecting images, applying simulations, and managing accessibility enhancements.
- Selected Image Overlay: Manages the application of simulations to selected images and handles saving these changes.

### Potential Impact
Empathy Vision addresses a critical gap in design accessibility by allowing designers to experience their work through the eyes of individuals with various impairments. By incorporating features like color blindness simulations, low-light adjustments, and accessibility enhancements, this tool empowers designers to create more inclusive and user-friendly designs.

### Future Enhancements
- Expanded Simulations: Introduce additional simulations for other visual impairments, such as tunnel vision or macular degeneration.
- Customisation: Provide users with more control over the intensity of simulations, such as adjusting blur levels or brightness contrast settings.
- Analytics and Feedback: Offer feedback on how well a design meets accessibility standards based on the applied simulations, guiding designers toward more inclusive practices.

## How to Get Started
- Clone the Repository: Download the project files to your local machine.
- Install Dependencies: Run `npm install`to install all necessary packages.
- Run the Project: Use `npm start` to launch the app in Canva’s development environment.
- Start Simulating: Open the Canva editor, select or upload an image, and begin applying visual impairment and accessibility simulations to enhance your design process.

## Contributions
Contributions are welcome to help expand the tool’s capabilities. Whether it's adding new simulations, improving the user interface, or enhancing backend functionality, your input can help make designs more accessible and inclusive.
