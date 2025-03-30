# ELD Compliant Trip Planner

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack web application built with Django and React that helps truck drivers plan routes while considering Hours of Service (HOS) regulations and generates predicted Electronic Logging Device (ELD) log sheets.

**[Link to Live Demo]** (Replace with your Vercel/deployment link if available)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Screenshots](#screenshots)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Backend (Django)](#backend-django)
  - [Frontend (React)](#frontend-react)
  - [Geoapify API Key](#geoapify-api-key)
- [Usage](#usage)
- [Export Formats](#export-formats)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Contact](#contact)

---

## Overview

Planning trucking routes manually while ensuring compliance with complex Hours of Service (HOS) rules can be time-consuming and error-prone. This application automates the process by:

1.  Taking basic trip details (start, pickup, dropoff locations) and the driver's current HOS status (70-hour cycle usage).
2.  Calculating an estimated driving route using the Geoapify API.
3.  Simulating the trip according to specified HOS rules (daily driving limits, required breaks, fuel stops).
4.  Generating a detailed list of trip segments (Driving, Rest, Pickup, Dropoff, Fuel).
5.  Creating predicted daily ELD log data based on the planned segments.
6.  Displaying the route, segments, and ELD logs in a user-friendly interface.
7.  Allowing users to export the trip plan and log sheets in various formats.

This project aims to provide drivers and dispatchers with a tool for proactive compliance planning.

---

## Features

- 📍 **Route Planning:** Calculates driving routes between multiple locations (current, pickup, dropoff).
- 🗺️ **Interactive Map:** Displays the calculated route, start, pickup, and dropoff points using MapLibre GL JS and Geoapify.
- ⏱️ **HOS Simulation:** Automatically inserts required REST breaks (10-hour, 30-minute) and planned FUEL stops based on configurable rules (e.g., max driving hours, max distance before fuel).
- 📊 **Trip Segments:** Shows a detailed breakdown of the planned trip into driving, resting, fueling, pickup, and dropoff segments with estimated durations and distances.
- 📑 **ELD Log Generation:** Automatically generates predicted daily ELD log data based on the planned segments.
- 📈 **ELD Log Visualization:** Displays the generated ELD data with:
  - Daily summary cards for each duty status (Driving, On Duty, Off Duty, Sleeper Berth).
  - A 24-hour timeline graph visually representing duty status changes.
  - A detailed list of status changes throughout the day.
- 📄 **Multi-Format Export:** Allows users to export the generated trip plan and logs as:
  - **JSON:** Complete trip data including segments and logs.
  - **CSV:** Segment details including locations, times, distance, and coordinates.
  - **PDF:** Formatted daily log sheets mimicking the traditional paper log grid, including drawn status lines.

---

## Technology Stack

- **Backend:**
  - Python
  - Django
  - Django REST Framework
  - `requests` (for API calls)
  - `python-decouple` (for environment variables)
  - `pytz` (for timezones)
- **Frontend:**
  - React
  - Vite (or Create React App)
  - Tailwind CSS
  - MapLibre GL JS (Map rendering)
  - Axios (HTTP requests)
  - `react-router-dom` (Routing)
  - `@heroicons/react` (Icons)
  - `jspdf`, `jspdf-autotable` (PDF generation)
- **APIs:**
  - Geoapify (Geocoding API, Routing API, Map Tiles)
- **Database:**
  - PostgreSQL (Recommended for production)
  - SQLite (Default for development)

---

## Screenshots

_Include screenshots of your application here._

- **Trip Planner Input Form:**
  `[Insert Screenshot of TripPlanner.jsx]`
- **Result - Route Map Tab:**
  `[Insert Screenshot of RouteMap Tab]`
- **Result - Trip Segments Tab:**
  `[Insert Screenshot of Trip Segments Tab]`
- **Result - ELD Logs Tab (Viewer):**
  `[Insert Screenshot of ELD Log Viewer Tab]`
- **Exported PDF Example:**
  `[Insert Screenshot of Generated PDF Log Sheet]`

---

## Setup and Installation

### Prerequisites

- Python (3.8+ recommended)
- Node.js and npm (or yarn)
- Git

### Backend (Django)

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>/backend # Or your backend folder name
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up environment variables:**
    - Create a `.env` file in the `backend` directory.
    - Add your Geoapify API key (See [Geoapify API Key](#geoapify-api-key) section below):
      ```dotenv
      # .env
      GEOAPIFY_API_KEY=YOUR_ACTUAL_GEOAPIFY_KEY
      # Optional: Add Database URL if using PostgreSQL, Secret Key, Debug settings
      # DATABASE_URL=postgres://user:password@host:port/dbname
      # SECRET_KEY=your_strong_django_secret_key
      # DEBUG=True
      ```
5.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```
6.  **Start the Django development server:**
    ```bash
    python manage.py runserver
    ```
    The backend should now be running, typically at `http://127.0.0.1:8000/`.

### Frontend (React)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend # Or your frontend folder name (from the repository root)
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Environment Variables (Optional but Recommended):**
    - If your frontend needs to know the backend API URL explicitly (especially for production builds), create a `.env` file in the `frontend` directory:
      ```dotenv
      # .env (for Vite)
      VITE_API_BASE_URL=http://127.0.0.1:8000
      # .env (for Create React App)
      # REACT_APP_API_BASE_URL=http://127.0.0.1:8000
      ```
    - _Note:_ The current setup likely uses Vite's proxy feature (in `vite.config.js`) or CRA's proxy (in `package.json`) to forward `/api` requests to the backend during development, so a frontend `.env` might not be strictly necessary for local development if the proxy is configured. Adjust based on your setup.
4.  **Start the React development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or (if using Create React App)
    # npm start / yarn start
    ```
    The frontend should now be running, typically at `http://localhost:5173/` (for Vite) or `http://localhost:3000/` (for CRA).

### Geoapify API Key

This application relies heavily on Geoapify for mapping, geocoding, and routing.

1.  **Sign Up:** Go to [Geoapify](https://www.geoapify.com/) and sign up for an account (they offer a generous free tier).
2.  **Create Project & API Key:** Create a new project in your Geoapify dashboard and generate an API key.
3.  **Enable APIs:** **Crucially**, ensure that the **Geocoding API** and the **Routing API** are **enabled** for the specific API key you generated within your Geoapify project settings. Map Tiles are usually enabled by default.
4.  **Configure Backend:** Copy your generated API key and paste it into the `.env` file in your `backend` directory as the value for `GEOAPIFY_API_KEY`.

---

## Usage

1.  Make sure both the backend and frontend development servers are running.
2.  Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173/`).
3.  You should see the "ELD Trip Planner" input form.
4.  Enter the required locations (Current, Pickup, Dropoff) and the hours already used in the driver's current 70-hour cycle.
5.  Click "Plan Trip".
6.  The application will contact the backend, which performs geocoding, routing, and HOS simulation.
7.  If successful, you will be redirected to the results page (`/result/:tripId`).
8.  Explore the results using the tabs:
    - **Route Map:** View the interactive map with the route and stops.
    - **Trip Segments:** See the detailed list of planned driving, rest, pickup, etc., segments.
    - **ELD Logs:** View the generated ELD log data, including the timeline graph and summary. Use the date tabs (if the trip spans multiple days) to view specific logs.
9.  Use the "Export" buttons in the header to download the trip data in JSON, CSV, or PDF (Log Sheet) format.

---

## Deployment

- **Backend (Django):** Can be deployed to platforms like Heroku, Render, PythonAnywhere, or a traditional VPS. Ensure environment variables (especially `GEOAPIFY_API_KEY`, `SECRET_KEY`, `DATABASE_URL`, `DEBUG=False`) are set correctly on the deployment server. You may need to configure `ALLOWED_HOSTS` in `settings.py`.
- **Frontend (React):** Can be deployed as a static site to platforms like Vercel, Netlify, GitHub Pages, etc.
  - Run `npm run build` (or `yarn build`) to create a production build.
  - Configure environment variables on the hosting platform if your frontend needs the backend URL (e.g., `VITE_API_BASE_URL`).
  - Set up server-side routing or rewrite rules if using `react-router-dom` in `BrowserRouter` mode to handle page reloads correctly.
  - If deploying frontend and backend separately, configure CORS (Cross-Origin Resource Sharing) on the Django backend (using `django-cors-headers`) to allow requests from your frontend domain.

---
