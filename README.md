# Blueprint Buddy

Blueprint Buddy is an AI-driven furniture design and build-plan generator. It uses Google's Gemini AI to transform natural language prompts into structured, professional-grade woodworking plans, complete with 3D models, cut lists, and assembly instructions.

## Features

- **AI-Driven Design Chat**: Describe your furniture project, and the AI will generate a comprehensive build plan.
- **Interactive 3D Preview**: Visualize your design in a 3D workspace with assembled and exploded views.
- **Professional Build Plans**:
  - **Cut Lists**: Precise dimensions exportable as CSV.
  - **Bill of Materials (BOM)**: Hardware and material lists with estimated costs.
  - **Assembly Instructions**: Step-by-step guides.
- **Project History**: Securely save and manage your previous designs using Firebase Firestore.
- **Customizable Units**: Choose between inches, cm, or mm.
- **Experience Levels**: Tailor the complexity of the joinery and instructions to your skill level (Beginner, Intermediate, Advanced).

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons, Framer Motion
- **3D Rendering**: React Three Fiber, Drei
- **Backend**: Express.js with Vite middleware
- **Database & Auth**: Firebase (Firestore, Google Auth)
- **AI**: Google Gemini API (`@google/genai`)

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up your `.env` file with your `GEMINI_API_KEY` and Firebase configuration.
4. Run the development server: `npm run dev`
5. Build for production: `npm run build`
