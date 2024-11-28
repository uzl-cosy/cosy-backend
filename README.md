# CoSy

![Express.js](https://img.shields.io/badge/Express-4.18.2-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![NPM](https://img.shields.io/badge/Build-NPM-blue.svg)


**CoSy** (Communication Support System) is an AI-based learning assistance system developed at the University of Lübeck. It supports the development of patient-oriented communication skills among students, particularly in medical contexts. CoSy records role-playing scenarios in communication modules using microphones. It provides participants with individual feedback based on quantifiable parameters such as volume, speaking pace, and speaking time. This feedback can be effectively integrated into instructor feedback.

## Table of Contents

- [CoSy](#cosy)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Technical Architecture](#technical-architecture)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Command Line Execution](#command-line-execution)
    - [Configuration](#configuration)
    - [Starting with Electron GUI](#starting-with-electron-gui)
    - [Local Hosting of Backend and Frontend](#local-hosting-of-backend-and-frontend)
  - [License](#license)

## Overview

**CoSy** is an AI-based learning assistance system developed at the University of Lübeck. It supports the development of patient-oriented communication skills among students, particularly in medical contexts.

## Technical Architecture

The **CoSy** system consists of several components:

- **CoSy Processor**: This repository contains the software that uses and controls specific AI modules and communicates with the backend. The processor handles all data processing locally on the executing device, ensuring data privacy and efficiency.
- **CoSy Backend**: The processor communicates with the backend, which stores and manages the processed data.
- **CoSy Frontend**: The backend information is displayed in a frontend application, providing participants and instructors with insightful feedback and analysis.

This architecture allows for efficient processing and secure handling of sensitive data, as audio recordings and analyses are performed locally before being communicated to the backend for aggregation and display.

## Installation

To install and set up **CoSy**, follow these steps:


1. **Clone the repository:**

     ```bash
     git clone https://github.com/yourusername/cosy.git
     cd cosy
     ```

2. **Install dependencies:**

     Make sure you have [Poetry](https://python-poetry.org/) installed. Then run:

     ```bash
     poetry install
     ```

## Usage

### Command Line Execution

You can run **CoSy** directly from the command line using the following command:

```bash
poetry run main -c config.yml
```

- **Note:** The parameter ```-c config.yml``` specifies the configuration file to use. If you omit this parameter, **CoSy** will use the default configuration.

### Configuration

**CoSy** uses a YAML configuration file (```config.yml```) to customize its behavior. You can modify the default configuration or provide your own configuration file.

- **Using the default configuration:**

    Simply run:

    ```bash
    poetry run main
    ```

    This runs **CoSy** with default settings.

- **Using a custom configuration file:**

    Create your own ```config.yml``` file with desired settings and run:

    ```bash
    poetry run main -c path/to/your_config.yml
    ```

### Starting with Electron GUI

**CoSy** can also be started using an Electron GUI that provides a more user-friendly interface.

1. **Navigate to the GUI directory:**

     ```bash
     cd gui
     ```

2. **Build the GUI:**

     You need to build the Electron GUI before starting.

     - Install dependencies:

         ```bash
         npm install
         ```

     - Build GUI:

         ```bash
         npm run build
         ```

3. **Start the GUI:**

     After building, you can start the Electron application:

     ```bash
     npm start
     ```

### Local Hosting of Backend and Frontend

You can host local instances of the CoSy backend and frontend using Docker Compose.

1. **Clone and prepare related repositories:**

    ```bash
    # Clone backend repository
    git clone https://github.com/yourusername/cosy-backend.git
    
    # Clone frontend repository
    git clone https://github.com/yourusername/cosy-frontend.git
    
    # Create symbolic links
    ln -s ../cosy-backend ./backend
    ln -s ../cosy-frontend ./frontend
    ```
2. **Edit Docker Compose file:**
    Update the context path in the Docker Compose file (```docker-compose.yml```) to point to the backend and frontend directories.
3. **Build Docker images:**

    ```bash
    docker-compose build
    ```



## Links & Verwendete Ressourcen

- Icons: [https://www.untitledui.com/icons](https://www.untitledui.com/icons)
- Figma: [https://www.figma.com/file/lBEl9snPE37REbS9J37njk/Ipad---Interactive_LABORATORIUM?node-id=728%3A5250&t=vx6WST5JYsuOhF3m-0](https://www.figma.com/file/lBEl9snPE37REbS9J37njk/Ipad---Interactive_LABORATORIUM?node-id=728%3A5250&t=vx6WST5JYsuOhF3m-0)
- Miro: [text](https://)
- vite-plugin-ssr: [https://vite-plugin-ssr.com/](https://vite-plugin-ssr.com/)


* Install Node (used version: v20.10.0)


* Install dependencies:
npm install 

* Start application
npm run dev
