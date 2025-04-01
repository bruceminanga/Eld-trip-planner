# 🚚 ELD Compliant Trip Planner

A full-stack web application built with Django and React that helps truck drivers plan routes while maintaining Hours of Service (HOS) compliance and automatically generates Electronic Logging Device (ELD) logs.

## Demo

First, click this link to view the backend: https://eld-trip-planner-0e76.onrender.com/api/trips/
Then click this for frontend view: https://frontend-nine-sepia-71.vercel.app. Please go in that order(by clicking backend link, then frontend link)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Backend (Django)](#backend-django)
  - [Frontend (React)](#frontend-react)
  - [Geoapify API Key](#geoapify-api-key)
- [Usage](#usage)

---

## 📋 Overview

Planning trucking routes while ensuring compliance with complex Hours of Service (HOS) regulations can be time-consuming and error-prone. This application automates the process by:

1. Converting basic trip inputs into detailed, regulation-compliant route plans
2. Simulating trips according to federal HOS rules
3. Generating predicted ELD logs for proactive compliance planning
4. Visualizing routes, segments, and logs in an intuitive interface
5. Supporting multi-format exports for documentation needs

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
  - SQLite (Default for development)

---

## Setup and Installation

### Prerequisites

- Python (3.8+ recommended)
- Node.js and npm (or yarn)
- Git
- React 19
- Django 4

### Backend (Django)

1.  **Clone the repository:**

    ```bash
    git clone git@github.com:bruceminanga/Eld-trip-planner.git

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

    - Create a `.env` file in the `frontend` directory.
    - Add your Geoapify API key (See [Geoapify API Key](#geoapify-api-key) section below):

      ```dotenv
      # .env
      GEOAPIFY_API_KEY=YOUR_ACTUAL_GEOAPIFY_KEY
      ```

    - Create .env file to the fronend directory and put the following:

      VITE_GEOAPIFY_API_KEY=YOUR_ACTUAL_GEOAPIFY_KEY
      VITE_API_BASE_URL="https://eld-trip-planner-0e76.onrender.com/api"

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
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Start the React development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or (if using Create React App)
    # npm start / yarn start
    ```
    The frontend should now be running, typically at `http://localhost:5173/` (for Vite)

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
