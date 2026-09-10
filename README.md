# Tactical Viewport

aadivasi 
Member 4: 3D Tactical Frontend & UI (React + Three.js / CesiumJS)
Tool: React (Vite), Tailwind CSS, Three.js or CesiumJS.

Task:

Build a dual-pane command dashboard:

Left 40%: Embedded raw video feed with 2D bounding boxes overlaid.

Right 60%: Interactive 3D view (orbit controls, dark tactical/night-vision color scheme).

Connect to Member 3’s WebSocket.

Render the drone as an icon/frustum hovering in 3D space, and render detected targets as dynamic 3D pins on the ground plane:

Red Cylinders/Markers: Enemy infantry.

Orange Boxes: Military trucks/convoys.

Add a flashing "THREAT DETECTED" alert panel and real-time target coordinate log.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/468e31d6-987a-43ff-a5fe-e111491e9399).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
